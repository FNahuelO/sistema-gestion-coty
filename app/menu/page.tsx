'use client'

import { Suspense } from 'react'
import { CartProvider, OrdersProvider, TablesProvider, BusinessProvider, AuthProvider } from '@/lib/store'
import { MenuPage } from '@/components/customer/menu'
import { LoadingScreen } from '@/components/shared/loading'

export default function MenuPageWrapper() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <CartProvider>
              <Suspense fallback={<LoadingScreen />}>
                <MenuPage />
              </Suspense>
            </CartProvider>
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
