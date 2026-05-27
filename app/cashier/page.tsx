'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, OrdersProvider, BusinessProvider, useAuth } from '@/lib/store'
import { CashierDashboard } from '@/components/cashier/orders-dashboard'
import { LoadingScreen } from '@/components/shared/loading'

function CashierContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user?.role !== 'cashier' && user?.role !== 'admin') {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user || (user.role !== 'cashier' && user.role !== 'admin')) {
    return <LoadingScreen />
  }

  return <CashierDashboard />
}

export default function CashierPage() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <CashierContent />
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
