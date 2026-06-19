'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { PANEL_LIST_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { ORDER_TYPE_META } from '../constants'
import { CotyPriceBadge } from './coty-price-badge'

export function HistoryOrderRow({ order, compact = false }: { order: Order; compact?: boolean }) {
  const meta = ORDER_TYPE_META[order.type]
  const Icon = meta.icon

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-[#F8FBFA] px-2.5 py-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: COTY_TEAL }} />
          <span className="truncate text-xs">
            {order.displayCode ?? order.id} · {order.customerName}
          </span>
        </div>
        <CotyPriceBadge>{formatPrice(order.total)}</CotyPriceBadge>
      </div>
    )
  }

  return (
    <div
      className={cn(
        PANEL_LIST_ROW,
        'flex flex-col gap-3 border-l-4 md:flex-row md:items-center md:justify-between',
        meta.accent
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${COTY_QTY_BG}99` }}
        >
          <Icon className="h-4 w-4" style={{ color: COTY_TEAL }} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{order.displayCode ?? order.id}</p>
          <p className="truncate text-xs text-muted-foreground">
            {order.customerName} · {meta.label} · {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-12 md:pl-0">
        <StatusBadge status={order.status} />
        <CotyPriceBadge>{formatPrice(order.total)}</CotyPriceBadge>
      </div>
    </div>
  )
}
