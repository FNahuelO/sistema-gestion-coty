import type { ReactNode } from 'react'
import { COTY_QTY_BG, COTY_TEAL } from '@/lib/coty-theme'

export function CotyPriceBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
    >
      {children}
    </span>
  )
}
