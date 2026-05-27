'use client'

import { CartProvider, OrdersProvider, TablesProvider, BusinessProvider, AuthProvider } from '@/lib/store'
import { OrderStatusPage } from '@/components/customer/order-status'

export default function OrderStatusPageWrapper() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <CartProvider>
              <OrderStatusPage />
            </CartProvider>
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
