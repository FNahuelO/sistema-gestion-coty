'use client'

import { Suspense } from 'react'
import { CheckoutPage } from '@/components/customer/checkout'

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  )
}
