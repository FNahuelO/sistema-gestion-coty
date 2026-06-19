'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AuthProvider, useAuth } from '@/lib/store'
import { LoadingScreen } from '@/components/shared/loading'
import { canAccessAdmin } from '@/lib/permissions'

function AdminContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (!isLoading && user && !canAccessAdmin({ role: user.role === 'admin' ? 'admin' : 'staff', staffRole: user.staffRole })) {
      router.push('/staff')
    }
  }, [isLoading, router, user])

  if (isLoading || !user || !canAccessAdmin({ role: user.role === 'admin' ? 'admin' : 'staff', staffRole: user.staffRole })) {
    return <LoadingScreen />
  }

  return <AdminDashboard />
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  )
}
