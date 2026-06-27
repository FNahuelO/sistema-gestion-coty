'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpDown, CheckCircle, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ORDER_TYPE_LABELS } from '@/lib/order-labels'
import { ORDER_SORT_OPTIONS, sortOrders, type OrderSortKey } from '@/lib/order-sort'
import { PANEL_CARD, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

function getOrderSourceLabel(order: Order) {
  if (order.tableNumber) return `Mesa ${order.tableNumber}`
  return ORDER_TYPE_LABELS[order.type]
}

function notifyOrdersChanged() {
  window.dispatchEvent(new Event('coty-refresh-orders'))
}

export function KitchenSection() {
  const [sortBy, setSortBy] = useState<OrderSortKey>('oldest')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const { data, mutate, isLoading } = useSWR<Order[]>('/api/staff/operations', fetchJson, {
    refreshInterval: 8000,
  })

  const runKitchenAction = async (
    orderId: string,
    action: 'ack_kitchen' | 'mark_ready',
    successMessage: string
  ) => {
    const key = `${action}:${orderId}`
    setPendingAction(key)
    try {
      await fetch('/api/staff/operations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderId }),
      })
      await mutate()
      notifyOrdersChanged()
      toast.success(successMessage)
    } catch {
      toast.error('No se pudo actualizar la comanda')
    } finally {
      setPendingAction(null)
    }
  }

  const sortedOrders = useMemo(
    () => sortOrders(data ?? [], sortBy),
    [data, sortBy]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={cn(PANEL_CARD, 'flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between')}>
        <p className="text-sm text-muted-foreground">
          {sortedOrders.length === 1 ? '1 comanda' : `${sortedOrders.length} comandas`}
        </p>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as OrderSortKey)}>
          <SelectTrigger className="w-full border-gray-200 bg-[#F8FBFA] dark:border-border dark:bg-muted sm:w-56">
            <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-[#2D5A57]" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedOrders.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">Sin comandas pendientes</p>
        ) : (
          sortedOrders.map((order) => {
            const isPreparing = order.status === 'preparing'
            const action: 'ack_kitchen' | 'mark_ready' = isPreparing ? 'mark_ready' : 'ack_kitchen'
            const actionKey = `${action}:${order.id}`
            const isPending = pendingAction === actionKey

            return (
              <div key={order.id} className={cn(PANEL_CARD, 'p-4', isPreparing && 'ring-1 ring-orange-200')}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{order.displayCode ?? order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{getOrderSourceLabel(order)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <ul className="mb-4 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.product.name}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  {isPreparing ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={pendingAction !== null}
                      onClick={() => runKitchenAction(order.id, 'mark_ready', 'Pedido marcado como listo')}
                    >
                      {isPending ? (
                        <>
                          <Spinner className="mr-1.5" />
                          ...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Marcar listo
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={PANEL_PRIMARY_BTN}
                      disabled={pendingAction !== null}
                      onClick={() => runKitchenAction(order.id, 'ack_kitchen', 'Comanda tomada')}
                    >
                      {isPending ? (
                        <>
                          <Spinner className="mr-1.5" />
                          ...
                        </>
                      ) : (
                        <>
                          <ChefHat className="mr-1.5 h-4 w-4" />
                          Tomar comanda
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
