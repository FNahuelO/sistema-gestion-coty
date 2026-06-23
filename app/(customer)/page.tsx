'use client'

import { Suspense } from 'react'
import { CustomerLanding } from '@/components/customer/landing'
import { LoadingScreen } from '@/components/shared/loading'

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CustomerLanding />
    </Suspense>
  )
}
