'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, TablesProvider, OrdersProvider, BusinessProvider, useAuth } from '@/lib/store'
import { WaitressPanel } from '@/components/waitress/tables-panel'
import { LoadingScreen } from '@/components/shared/loading'

function WaitressContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user?.role !== 'waitress' && user?.role !== 'admin') {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user || (user.role !== 'waitress' && user.role !== 'admin')) {
    return <LoadingScreen />
  }

  return <WaitressPanel />
}

export default function WaitressPage() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <WaitressContent />
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
