import type { DefaultSession } from 'next-auth'
import type { StaffRoleType } from '@/lib/permissions'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: 'admin' | 'staff'
      staffRole?: StaffRoleType | null
      avatar?: string | null
    }
  }

  interface User {
    role: 'admin' | 'staff'
    staffRole?: StaffRoleType | null
    avatar?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'admin' | 'staff'
    staffRole?: StaffRoleType | null
    avatar?: string | null
  }
}
