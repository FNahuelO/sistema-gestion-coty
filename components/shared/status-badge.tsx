'use client'

import { cn } from '@/lib/utils'
import type { OrderStatus, TableStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus | TableStatus
  className?: string
}

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-warning/20 text-warning-foreground border-warning/30' },
  confirmed: { label: 'Confirmado', className: 'bg-info/20 text-info-foreground border-info/30' },
  preparing: { label: 'Preparando', className: 'bg-accent/20 text-accent-foreground border-accent/30' },
  ready: { label: 'Listo', className: 'bg-success/20 text-success-foreground border-success/30' },
  delivered: { label: 'Entregado', className: 'bg-success/20 text-success-foreground border-success/30' },
  completed: { label: 'Completado', className: 'bg-muted text-muted-foreground border-muted' },
  cancelled: { label: 'Cancelado', className: 'bg-destructive/20 text-destructive border-destructive/30' },
}

const tableStatusConfig: Record<TableStatus, { label: string; className: string }> = {
  free: { label: 'Libre', className: 'bg-success/20 text-success-foreground border-success/30' },
  occupied: { label: 'Ocupada', className: 'bg-accent/20 text-accent-foreground border-accent/30' },
  waiting: { label: 'Esperando', className: 'bg-warning/20 text-warning-foreground border-warning/30' },
  finished: { label: 'Por cobrar', className: 'bg-info/20 text-info-foreground border-info/30' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = orderStatusConfig[status as OrderStatus] || tableStatusConfig[status as TableStatus]
  
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
