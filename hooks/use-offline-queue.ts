'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getOfflineOrderQueue,
  getPendingOfflineOrders,
  OFFLINE_QUEUE_CHANGED_EVENT,
  queuedEntryToOrder,
  type QueuedOrderEntry,
} from '@/lib/offline-order-queue'
import { syncOfflineOrderQueue } from '@/lib/offline-order-sync'
import type { Order } from '@/lib/types'

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedOrderEntry[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const refresh = useCallback(() => {
    setQueue(getOfflineOrderQueue())
  }, [])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, onChange)
  }, [refresh])

  const pendingOrders = useMemo(
    () =>
      queue
        .filter((entry) => entry.status === 'pending' || entry.status === 'failed')
        .map(queuedEntryToOrder),
    [queue]
  )

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    try {
      return await syncOfflineOrderQueue()
    } finally {
      setIsSyncing(false)
      refresh()
    }
  }, [refresh])

  return {
    queue,
    pendingCount: queue.filter((entry) => entry.status === 'pending' || entry.status === 'failed').length,
    failedCount: queue.filter((entry) => entry.status === 'failed').length,
    pendingOrders,
    isSyncing,
    syncNow,
    refresh,
  }
}
