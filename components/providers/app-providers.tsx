'use client'

import { OfflineBanner } from '@/components/shared/offline-banner'
import { OfflineSyncProvider } from '@/components/providers/offline-sync-provider'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'

export function AppProviders() {
  return (
    <>
      <ServiceWorkerRegister />
      <OfflineSyncProvider />
      <OfflineBanner />
    </>
  )
}
