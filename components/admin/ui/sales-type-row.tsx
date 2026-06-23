import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_PRICE_BADGE, PANEL_PROGRESS_TRACK } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'

export function SalesTypeRow({
  label,
  value,
  percentage,
  accentClass,
}: {
  label: string
  value: number
  percentage?: number
  accentClass: string
}) {
  return (
    <div className={cn('rounded-xl border border-b-2 px-4 py-3 shadow-sm', PANEL_CARD, accentClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {percentage !== undefined && (
            <span className="text-xs text-muted-foreground">{percentage.toFixed(2)}%</span>
          )}
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', PANEL_PRICE_BADGE)}>
            {formatPrice(value)}
          </span>
        </div>
      </div>
      {percentage !== undefined && (
        <div className={cn('mt-2 h-1.5 overflow-hidden rounded-full', PANEL_PROGRESS_TRACK)}>
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
    </div>
  )
}
