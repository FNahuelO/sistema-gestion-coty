'use client'

import { AuthProvider } from '@/lib/store'
import { LoginPage } from '@/components/auth/login'

export default function LoginPageWrapper() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}
