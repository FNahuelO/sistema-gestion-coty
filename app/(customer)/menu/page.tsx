'use client'

import { Suspense } from 'react'
import { MenuPage } from '@/components/customer/menu'
import { CustomerMenuSkeleton } from '@/components/shared/loading'

export default function MenuPageWrapper() {
  return (
    <Suspense fallback={<CustomerMenuSkeleton />}>
      <MenuPage />
    </Suspense>
  )
}
