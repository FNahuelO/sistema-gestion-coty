'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AuthProvider, useAuth } from '@/lib/store'
import { LoadingScreen } from '@/components/shared/loading'

function AdminContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user?.role !== 'admin') {
      router.push('/staff')
    }
  }, [isLoading, router, user])

  if (isLoading || !user || user.role !== 'admin') {
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
