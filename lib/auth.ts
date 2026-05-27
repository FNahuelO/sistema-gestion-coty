import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

function mapRole(role: string): 'admin' | 'cashier' | 'waitress' {
  switch (role) {
    case 'ADMIN':
      return 'admin'
    case 'CASHIER':
      return 'cashier'
    default:
      return 'waitress'
  }
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.active) {
          return null
        }

        const validPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!validPassword) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: mapRole(user.role),
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
        token.avatar = user.avatar ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.avatar = token.avatar ?? null
      }
      return session
    },
  },
}
