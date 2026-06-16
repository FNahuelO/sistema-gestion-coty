'use client'

import { RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useOfflineQueue } from '@/hooks/use-offline-queue'

export function OfflineBanner() {
  const { isOffline } = useOnlineStatus()
  const { pendingCount, failedCount, isSyncing, syncNow } = useOfflineQueue()

  if (!isOffline && pendingCount === 0) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      {isOffline ? (
        <span>
          Sin conexión
          {pendingCount > 0
            ? ` — ${pendingCount} pedido${pendingCount === 1 ? '' : 's'} guardado${pendingCount === 1 ? '' : 's'} para enviar`
            : ' — los pedidos se guardan y envían al volver online'}
        </span>
      ) : (
        <span>
          {isSyncing
            ? 'Sincronizando pedidos pendientes...'
            : `${pendingCount} pedido${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'} de envío`}
          {failedCount > 0 ? ` (${failedCount} con error)` : ''}
        </span>
      )}
      {!isOffline && pendingCount > 0 && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-7 bg-white/90 text-amber-900 hover:bg-white"
          disabled={isSyncing}
          onClick={() => void syncNow()}
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      )}
    </div>
  )
}
