'use client'

import { Suspense } from 'react'
import { MenuPage } from '@/components/customer/menu'
import { LoadingScreen } from '@/components/shared/loading'

export default function MenuPageWrapper() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MenuPage />
    </Suspense>
  )
}
