import {
  getOfflineOrderQueue,
  markQueueEntryFailed,
  markQueueEntrySyncing,
  OFFLINE_ORDERS_SYNCED_EVENT,
  removeQueueEntry,
  type QueuedOrderEntry,
} from '@/lib/offline-order-queue'

const MAX_RETRIES = 5

async function postQueuedOrder(entry: QueuedOrderEntry) {
  if (entry.kind === 'table') {
    if (!entry.tableId) {
      throw new Error('Falta la mesa del pedido')
    }

    const response = await fetch(`/api/tables/${entry.tableId}/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: entry.payload.items,
        notes: entry.payload.notes,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error ?? 'No se pudo sincronizar el pedido de mesa')
    }

    return response.json()
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry.payload),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error ?? 'No se pudo sincronizar el pedido')
  }

  return response.json()
}

export async function syncOfflineOrderQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, skipped: true as const }
  }

  const queue = getOfflineOrderQueue()
  let synced = 0
  let failed = 0

  for (const entry of queue) {
    if (entry.status === 'syncing') continue
    if (entry.status === 'failed' && entry.retries >= MAX_RETRIES) continue

    markQueueEntrySyncing(entry.id)

    try {
      await postQueuedOrder(entry)
      removeQueueEntry(entry.id)
      synced += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de sincronización'
      markQueueEntryFailed(entry.id, message)
      failed += 1
    }
  }

  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_ORDERS_SYNCED_EVENT))
  }

  return { synced, failed, skipped: false as const }
}
