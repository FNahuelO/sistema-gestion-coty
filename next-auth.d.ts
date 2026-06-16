import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: 'admin' | 'staff'
      avatar?: string | null
    }
  }

  interface User {
    role: 'admin' | 'staff'
    avatar?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'admin' | 'staff'
    avatar?: string | null
  }
}
