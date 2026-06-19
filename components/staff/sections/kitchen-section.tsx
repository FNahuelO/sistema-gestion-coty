'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

export function KitchenSection() {
  const { data, mutate, isLoading } = useSWR<Order[]>('/api/staff/operations', fetchJson, {
    refreshInterval: 8000,
  })

  const ack = async (orderId: string) => {
    try {
      await fetch('/api/staff/operations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ack_kitchen', orderId }),
      })
      await mutate()
      toast.success('Comanda tomada')
    } catch {
      toast.error('No se pudo confirmar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const orders = data ?? []

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground">Sin comandas pendientes</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className={cn(PANEL_CARD, 'p-4')}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.displayCode ?? order.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {order.tableNumber ? `Mesa ${order.tableNumber}` : order.type}
                </p>
              </div>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            <ul className="mb-4 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.product.name}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <span className="font-serif font-semibold">{formatPrice(order.total)}</span>
              <Button size="sm" className={PANEL_PRIMARY_BTN} onClick={() => void ack(order.id)}>
                Tomar comanda
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
