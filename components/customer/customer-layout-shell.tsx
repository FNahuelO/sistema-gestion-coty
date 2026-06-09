'use client'

import { AuthProvider, BusinessProvider, CartProvider, OrdersProvider, TablesProvider } from '@/lib/store'
import { CustomerBottomNav } from '@/components/customer/bottom-nav'
import { CustomerTopNav } from '@/components/customer/top-nav'

export function CustomerLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>
        <OrdersProvider>
          <TablesProvider>
            <CartProvider>
              <CustomerTopNav />
              {children}
              <CustomerBottomNav />
            </CartProvider>
          </TablesProvider>
        </OrdersProvider>
      </BusinessProvider>
    </AuthProvider>
  )
}
