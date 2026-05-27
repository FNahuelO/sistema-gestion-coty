'use client'

import { CartProvider, OrdersProvider, TablesProvider, BusinessProvider, AuthProvider } from '@/lib/store'
import { CheckoutPage } from '@/components/customer/checkout'

export default function CheckoutPageWrapper() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <CartProvider>
              <CheckoutPage />
            </CartProvider>
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
