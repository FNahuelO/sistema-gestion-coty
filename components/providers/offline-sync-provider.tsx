'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useOfflineQueue } from '@/hooks/use-offline-queue'
import { getPendingOfflineOrders, OFFLINE_ORDERS_SYNCED_EVENT } from '@/lib/offline-order-queue'
import { syncOfflineOrderQueue } from '@/lib/offline-order-sync'

export function OfflineSyncProvider() {
  const { isOnline } = useOnlineStatus()
  const { refresh } = useOfflineQueue()
  const isSyncingRef = useRef(false)

  useEffect(() => {
    const onSynced = () => {
      window.dispatchEvent(new Event('coty-refresh-orders'))
    }
    window.addEventListener(OFFLINE_ORDERS_SYNCED_EVENT, onSynced)
    return () => window.removeEventListener(OFFLINE_ORDERS_SYNCED_EVENT, onSynced)
  }, [])

  useEffect(() => {
    const runSync = async (showToast: boolean) => {
      if (!navigator.onLine || isSyncingRef.current) return
      if (getPendingOfflineOrders().length === 0) return

      isSyncingRef.current = true
      try {
        const result = await syncOfflineOrderQueue()
        refresh()

        if (showToast && !result.skipped && result.synced > 0) {
          toast.success(
            result.synced === 1
              ? '1 pedido pendiente se sincronizó correctamente'
              : `${result.synced} pedidos pendientes se sincronizaron correctamente`
          )
        }
        if (showToast && !result.skipped && result.failed > 0) {
          toast.error(
            result.failed === 1
              ? 'No se pudo sincronizar 1 pedido'
              : `No se pudieron sincronizar ${result.failed} pedidos`
          )
        }
      } finally {
        isSyncingRef.current = false
      }
    }

    if (isOnline) {
      void runSync(false)
    }

    const onOnline = () => {
      void runSync(true)
    }

    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [isOnline, refresh])

  return null
}
