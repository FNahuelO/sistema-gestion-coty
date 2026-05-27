'use client'

import { CartProvider, OrdersProvider, TablesProvider, BusinessProvider, AuthProvider } from '@/lib/store'
import { CustomerLanding } from '@/components/customer/landing'

export default function HomePage() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <CartProvider>
              <CustomerLanding />
            </CartProvider>
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
