'use client'

import type { ElementType } from 'react'
import { COTY_QTY_BG, COTY_TEAL } from '@/lib/coty-theme'

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
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
      <div
        className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${COTY_QTY_BG}99` }}
      >
        <Icon className="h-5 w-5" style={{ color: COTY_TEAL }} />
      </div>
    </div>
  )
}
