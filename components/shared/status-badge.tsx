'use client'

import { cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS, TABLE_STATUS_LABELS } from '@/lib/order-labels'
import type { OrderStatus, TableStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus | TableStatus
  className?: string
  variant?: 'default' | 'onDark'
}

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-300 bg-amber-100 text-amber-950',
  confirmed: 'border-sky-300 bg-sky-100 text-sky-950',
  preparing: 'border-orange-300 bg-orange-100 text-orange-950',
  ready: 'border-emerald-300 bg-emerald-100 text-emerald-950',
  delivered: 'border-emerald-300 bg-emerald-100 text-emerald-950',
  completed: 'border-gray-300 bg-gray-100 text-gray-800',
  cancelled: 'border-red-300 bg-red-100 text-red-950',
}

const tableStatusStyles: Record<TableStatus, string> = {
  free: 'border-emerald-300 bg-emerald-100 text-emerald-950',
  occupied: 'border-teal-300 bg-[#C5DDD9] text-[#053E38]',
  waiting: 'border-amber-300 bg-amber-100 text-amber-950',
  finished: 'border-sky-300 bg-sky-100 text-sky-950',
}

const orderStatusOnDarkStyles: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-100 text-amber-950',
  confirmed: 'border-sky-200 bg-sky-100 text-sky-950',
  preparing: 'border-orange-200 bg-orange-100 text-orange-950',
  ready: 'border-emerald-200 bg-emerald-100 text-emerald-950',
  delivered: 'border-emerald-200 bg-emerald-100 text-emerald-950',
  completed: 'border-white/40 bg-white/90 text-gray-800',
  cancelled: 'border-red-200 bg-red-100 text-red-950',
}

const tableStatusOnDarkStyles: Record<TableStatus, string> = {
  free: 'border-emerald-200 bg-emerald-100 text-emerald-950',
  occupied: 'border-teal-200 bg-[#C5DDD9] text-[#053E38]',
  waiting: 'border-amber-200 bg-amber-100 text-amber-950',
  finished: 'border-sky-200 bg-sky-100 text-sky-950',
}

export function StatusBadge({ status, className, variant = 'default' }: StatusBadgeProps) {
  const isOrderStatus = status in ORDER_STATUS_LABELS
  const label = isOrderStatus
    ? ORDER_STATUS_LABELS[status as OrderStatus]
    : TABLE_STATUS_LABELS[status as TableStatus]

  const styleClass =
    variant === 'onDark'
      ? isOrderStatus
        ? orderStatusOnDarkStyles[status as OrderStatus]
        : tableStatusOnDarkStyles[status as TableStatus]
      : isOrderStatus
        ? orderStatusStyles[status as OrderStatus]
        : tableStatusStyles[status as TableStatus]

  if (!label) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
        styleClass,
        className
      )}
    >
      {label}
    </span>
  )
}
