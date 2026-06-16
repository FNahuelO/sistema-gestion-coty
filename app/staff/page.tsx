'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, TablesProvider, OrdersProvider, BusinessProvider, useAuth } from '@/lib/store'
import { StaffDashboard } from '@/components/staff/staff-dashboard'
import { LoadingScreen } from '@/components/shared/loading'
import { isStaffRole } from '@/lib/types'

function StaffContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user && !isStaffRole(user.role) && user.role !== 'admin') {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user || (!isStaffRole(user.role) && user.role !== 'admin')) {
    return <LoadingScreen />
  }

  return <StaffDashboard />
}

export default function StaffPage() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <StaffContent />
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
