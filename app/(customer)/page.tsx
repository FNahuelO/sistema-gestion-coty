'use client'

import { Suspense } from 'react'
import { CustomerLanding } from '@/components/customer/landing'
import { CustomerLandingSkeleton } from '@/components/shared/loading'

export default function HomePage() {
  return (
    <Suspense fallback={<CustomerLandingSkeleton />}>
      <CustomerLanding />
    </Suspense>
  )
}
