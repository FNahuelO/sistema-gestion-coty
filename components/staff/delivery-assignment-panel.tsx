'use client'

import useSWR from 'swr'
import { Truck } from 'lucide-react'
import { AssignRunnerSelect } from '@/components/staff/assign-runner-select'
import { Badge } from '@/components/ui/badge'
import { useAdaptiveRefreshInterval } from '@/hooks/use-adaptive-refresh-interval'
import { PANEL_CARD } from '@/lib/panel-theme'
import { formatDeliveryAssignmentStatus } from '@/lib/delivery-labels'
import type { DeliveryQueueEntry, Order } from '@/lib/types'
import { cn } from '@/lib/utils'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) return null
  return res.json()
}

export function DeliveryAssignmentPanel({
  order,
  onUpdated,
}: {
  order: Order
  onUpdated?: () => void
}) {
  const isDeliveredOrder = order.status === 'delivered' || order.status === 'completed'
  const shouldFetch =
    order.type === 'delivery' && !['completed', 'cancelled', 'delivered'].includes(order.status)

  const refreshInterval = useAdaptiveRefreshInterval<DeliveryQueueEntry | null>(20000, {
    enabled: shouldFetch,
    // Si estamos polleando este pedido, hay trabajo activo.
    activeCount: shouldFetch ? 1 : 0,
  })
  const { data: entry, mutate } = useSWR<DeliveryQueueEntry | null>(
    shouldFetch ? `/api/staff/operations?view=delivery&orderId=${order.id}` : null,
    fetchJson,
    { refreshInterval }
  )

  if (order.type !== 'delivery' || order.status === 'cancelled') return null

  const assignmentStatus = entry?.assignmentStatus ?? 'unassigned'
  const isFinished = isDeliveredOrder || assignmentStatus === 'delivered'

  return (
    <section className={cn(PANEL_CARD, 'overflow-hidden p-0')}>
      <div className="border-b border-gray-100 bg-[#F8FBFA] px-4 py-3 dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
            <Truck className="h-3.5 w-3.5" />
            Cadete
          </h3>
          {!isFinished ? (
            <Badge className="border-0 bg-[#C5DDD9]/60 text-[10px] text-[#2D5A57] hover:bg-[#C5DDD9]/60">
              {formatDeliveryAssignmentStatus(assignmentStatus)}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {isFinished ? (
          <p className="text-sm text-muted-foreground">
            {entry?.runner
              ? `Entregado por ${entry.runner.name}`
              : 'Pedido marcado como entregado'}
          </p>
        ) : (
          <>
            <AssignRunnerSelect
              orderId={order.id}
              runner={entry?.runner}
              assignmentStatus={assignmentStatus}
              onAssigned={() => {
                void mutate()
                onUpdated?.()
              }}
              disabled={assignmentStatus === 'picked_up'}
            />
            {assignmentStatus === 'picked_up' ? (
              <p className="text-xs text-sky-800">
                El pedido está en camino. Seguí el estado en la sección Cadetes.
              </p>
            ) : assignmentStatus === 'unassigned' ? (
              <p className="text-xs text-muted-foreground">
                Asigná un cadete para coordinar la entrega.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
