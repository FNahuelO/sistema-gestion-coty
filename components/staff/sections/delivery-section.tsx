'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Phone, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssignRunnerSelect } from '@/components/staff/assign-runner-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { formatDeliveryAssignmentStatus } from '@/lib/delivery-labels'
import { isDisplayableCustomerPhone } from '@/lib/order-labels'
import type { DeliveryQueueEntry } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

function assignmentBadgeClass(status: DeliveryQueueEntry['assignmentStatus']) {
  switch (status) {
    case 'picked_up':
      return 'bg-sky-100 text-sky-800 hover:bg-sky-100'
    case 'assigned':
      return 'bg-[#C5DDD9]/70 text-[#2D5A57] hover:bg-[#C5DDD9]/70'
    case 'unassigned':
      return 'bg-amber-100 text-amber-900 hover:bg-amber-100'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100'
  }
}

function DeliveryQueueCard({
  entry,
  onUpdated,
}: {
  entry: DeliveryQueueEntry
  onUpdated: () => void
}) {
  const updateStatus = async (status: 'picked_up' | 'delivered') => {
    try {
      const res = await fetch('/api/staff/operations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: entry.orderId, status }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? 'No se pudo actualizar')
      }
      await onUpdated()
      toast.success(status === 'picked_up' ? 'Pedido retirado' : 'Pedido entregado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar')
    }
  }

  const canMarkPickedUp = entry.assignmentStatus === 'assigned'
  const canMarkDelivered = entry.assignmentStatus === 'picked_up'
  const waitingForKitchen = ['confirmed', 'preparing'].includes(entry.orderStatus)

  return (
    <div className={cn(PANEL_LIST_ROW, 'border-l-4 border-l-[#E8A598]')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">
              {entry.order.displayCode ?? entry.orderId}
            </p>
            <StatusBadge status={entry.orderStatus} />
            <Badge className={cn('border-0 text-[10px]', assignmentBadgeClass(entry.assignmentStatus))}>
              {formatDeliveryAssignmentStatus(entry.assignmentStatus)}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="font-medium">{entry.order.customerName}</p>
            {isDisplayableCustomerPhone(entry.order.customerPhone) ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {entry.order.customerPhone}
              </p>
            ) : null}
            {entry.order.customerAddress ? (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{entry.order.customerAddress}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{formatPrice(entry.order.total)}</span>
            {entry.order.deliveryFee ? <span>Envío {formatPrice(entry.order.deliveryFee)}</span> : null}
            <span>
              {formatDistanceToNow(new Date(entry.order.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>

          {waitingForKitchen ? (
            <p className="text-xs text-amber-800">
              Podés asignar cadete ahora; el pedido sigue en cocina.
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px] sm:items-end">
          <AssignRunnerSelect
            orderId={entry.orderId}
            runner={entry.runner}
            assignmentStatus={entry.assignmentStatus}
            onAssigned={onUpdated}
            disabled={entry.assignmentStatus === 'picked_up'}
          />

          {canMarkPickedUp ? (
            <Button
              size="sm"
              className={cn('w-full sm:w-auto', PANEL_PRIMARY_BTN)}
              onClick={() => void updateStatus('picked_up')}
            >
              Retirado
            </Button>
          ) : null}
          {canMarkDelivered ? (
            <Button
              size="sm"
              className={cn('w-full sm:w-auto', PANEL_PRIMARY_BTN)}
              onClick={() => void updateStatus('delivered')}
            >
              Entregado
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function QueueGroup({
  title,
  description,
  entries,
  onUpdated,
}: {
  title: string
  description?: string
  entries: DeliveryQueueEntry[]
  onUpdated: () => void
}) {
  if (entries.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <DeliveryQueueCard key={entry.orderId} entry={entry} onUpdated={onUpdated} />
        ))}
      </div>
    </section>
  )
}

export function DeliverySection() {
  const { data, mutate, isLoading } = useSWR<DeliveryQueueEntry[]>(
    '/api/staff/operations?view=delivery',
    fetchJson,
    { refreshInterval: 12000 }
  )

  const entries = data ?? []
  const onTheWay = entries.filter((entry) => entry.assignmentStatus === 'picked_up')
  const readyForPickup = entries.filter(
    (entry) =>
      entry.assignmentStatus !== 'picked_up' &&
      (entry.orderStatus === 'ready' || entry.orderStatus === 'delivered')
  )
  const inKitchen = entries.filter(
    (entry) =>
      entry.assignmentStatus !== 'picked_up' &&
      ['confirmed', 'preparing'].includes(entry.orderStatus)
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className={cn(PANEL_CARD, 'flex flex-col items-center gap-3 px-6 py-12 text-center')}>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: '#C5DDD9' }}
        >
          <Truck className="h-6 w-6" style={{ color: COTY_TEAL }} />
        </div>
        <div>
          <p className="font-medium text-foreground">Sin entregas activas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los pedidos delivery confirmados aparecerán acá para asignar cadete.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <QueueGroup
        title="En camino"
        description="Pedidos retirados por el cadete"
        entries={onTheWay}
        onUpdated={() => void mutate()}
      />
      <QueueGroup
        title="Listos para salir"
        description="Pedidos listos en cocina"
        entries={readyForPickup}
        onUpdated={() => void mutate()}
      />
      <QueueGroup
        title="En preparación"
        description="Podés asignar cadete antes de que estén listos"
        entries={inKitchen}
        onUpdated={() => void mutate()}
      />
    </div>
  )
}
