import type { ReactNode } from 'react'
import { PANEL_PRICE_BADGE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function CotyPriceBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold', PANEL_PRICE_BADGE, className)}>
      {children}
    </span>
  )
}
