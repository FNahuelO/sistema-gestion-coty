import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { mapStaffRole } from '@/lib/permissions'
import { checkRateLimit, clearRateLimit, registerFailedAttempt } from '@/lib/rate-limit'
import { RATE_LIMITED_ERROR } from '@/lib/auth-errors'

type RequestLike = { headers?: Record<string, string | string[] | undefined> }

function getClientIp(req?: RequestLike): string {
  const headers = req?.headers ?? {}
  const forwardedFor = headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0]!.trim()
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]!.split(',')[0]!.trim()
  }
  const realIp = headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp
  }
  return 'unknown'
}

function mapRole(role: string): 'admin' | 'staff' {
  switch (role) {
    case 'ADMIN':
      return 'admin'
    default:
      return 'staff'
  }
}

async function authenticateWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !user.active) return null

  const validPassword = await bcrypt.compare(password, user.passwordHash)
  if (!validPassword) return null

  return user
}

async function authenticateWithPin(pin: string) {
  const users = await prisma.user.findMany({
    where: {
      active: true,
      pinHash: { not: null },
    },
  })

  for (const user of users) {
    if (!user.pinHash) continue
    const validPin = await bcrypt.compare(pin, user.pinHash)
    if (validPin) return user
  }

  return null
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        loginMode: { label: 'Modo', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials, req) {
        const loginMode = credentials?.loginMode ?? 'password'
        const ip = getClientIp(req)
        const rateLimitKey = `login:${ip}`

        const status = checkRateLimit(rateLimitKey)
        if (status.blocked) {
          throw new Error(RATE_LIMITED_ERROR)
        }

        const user =
          loginMode === 'pin'
            ? credentials?.pin && credentials.pin.length >= 4
              ? await authenticateWithPin(credentials.pin)
              : null
            : credentials?.email && credentials.password
              ? await authenticateWithPassword(credentials.email, credentials.password)
              : null

        if (!user) {
          const failure = registerFailedAttempt(rateLimitKey)
          if (failure.blocked) {
            throw new Error(RATE_LIMITED_ERROR)
          }
          return null
        }

        clearRateLimit(rateLimitKey)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: mapRole(user.role),
          staffRole: mapStaffRole(user.staffRole),
          avatar: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.staffRole = user.staffRole ?? null
        token.avatar = user.avatar ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.staffRole = token.staffRole ?? null
        session.user.avatar = token.avatar ?? null
      }
      return session
    },
  },
}
