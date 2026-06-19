import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { mapStaffRole } from '@/lib/permissions'

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
      async authorize(credentials) {
        const loginMode = credentials?.loginMode ?? 'password'

        if (loginMode === 'pin') {
          if (!credentials?.pin || credentials.pin.length < 4) return null
          const user = await authenticateWithPin(credentials.pin)
          if (!user) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: mapRole(user.role),
            staffRole: mapStaffRole(user.staffRole),
            avatar: user.avatarUrl,
          }
        }

        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await authenticateWithPassword(credentials.email, credentials.password)
        if (!user) return null

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
