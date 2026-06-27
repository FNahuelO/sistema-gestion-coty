'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Bell, BellRing, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StatusBadge } from '@/components/shared/status-badge'
import { PANEL_OUTLINE_BTN } from '@/lib/panel-theme'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

type TableCall = {
  id: string
  createdAt: string
  table: { number: number }
}

const fetchJson = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Error al cargar')
  return response.json()
}

interface StaffNotificationsButtonProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
  onNavigateToCalls?: () => void
  className?: string
}

export function StaffNotificationsButton({
  orders,
  onSelectOrder,
  onNavigateToCalls,
  className,
}: StaffNotificationsButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: tableCalls } = useSWR<TableCall[]>('/api/table-calls', fetchJson, {
    refreshInterval: 5000,
  })

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'pending'),
    [orders]
  )
  const calls = tableCalls ?? []
  const count = pendingOrders.length + calls.length

  const handleSelectOrder = (order: Order) => {
    onSelectOrder(order)
    setOpen(false)
  }

  const handleGoToCalls = () => {
    setOpen(false)
    onNavigateToCalls?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative shrink-0', PANEL_OUTLINE_BTN, className)}
          aria-label={count > 0 ? `${count} notificaciones` : 'Notificaciones'}
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-border">
          <p className="text-sm font-semibold text-foreground">Notificaciones</p>
          <p className="text-xs text-muted-foreground">
            {count === 0 ? 'Todo al día' : `${count} pendiente${count === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin notificaciones nuevas
            </p>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <section>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Pedidos pendientes
                  </p>
                  <ul>
                    {pendingOrders.map((order) => (
                      <li key={order.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectOrder(order)}
                          className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F8FBFA] dark:hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                            <Clock className="h-4 w-4 text-amber-800" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">
                                {order.displayCode ?? `#${order.id}`}
                              </p>
                              <StatusBadge status={order.status} className="shrink-0 text-[10px]" />
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{order.customerName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {calls.length > 0 && (
                <section className={pendingOrders.length > 0 ? 'border-t border-gray-100 dark:border-border' : ''}>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Llamados de mesa
                  </p>
                  <ul>
                    {calls.map((call) => (
                      <li key={call.id}>
                        <button
                          type="button"
                          onClick={handleGoToCalls}
                          className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F8FBFA] dark:hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCE8E4]">
                            <BellRing className="h-4 w-4 text-[#E8A598]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">Mesa {call.table.number}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(call.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                            {onNavigateToCalls && (
                              <p className="mt-0.5 text-[11px] font-medium text-[#2D5A57]">
                                Ver en Mozos →
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
