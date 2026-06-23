'use client'

import type { ElementType } from 'react'
import { PANEL_CARD, PANEL_ICON_CIRCLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function MetricCard({
  title,
  value,
  icon: Icon,
  comparison,
}: {
  title: string
  value: string
  icon: ElementType
  comparison?: number | null
}) {
  return (
    <div className={cn('flex items-center justify-between p-4', PANEL_CARD)}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {comparison !== undefined && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {comparison === null
              ? '--% vs ayer'
              : `${comparison >= 0 ? '+' : ''}${comparison.toFixed(0)}% vs ayer`}
          </p>
        )}
      </div>
      <div className={cn('ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full', PANEL_ICON_CIRCLE)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}
