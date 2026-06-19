import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
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
    <div
      className={cn(
        'rounded-xl border border-gray-100 border-b-2 bg-white px-4 py-3 shadow-sm',
        accentClass
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {percentage !== undefined && (
            <span className="text-xs text-muted-foreground">{percentage.toFixed(2)}%</span>
          )}
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
          >
            {formatPrice(value)}
          </span>
        </div>
      </div>
      {percentage !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: COTY_TEAL }}
          />
        </div>
      )}
    </div>
  )
}
