'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/coty-theme'
import { PAYMENT_METHOD_LABELS } from '@/lib/order-labels'
import {
  roundMoney,
  sumSplitAmounts,
  type PaymentSplitInput,
  type SplittablePaymentMethod,
} from '@/lib/payment-splits'
import { cn } from '@/lib/utils'

type PaymentSplitsEditorProps = {
  total: number
  methods: readonly SplittablePaymentMethod[]
  amounts: Partial<Record<SplittablePaymentMethod, string>>
  onChange: (method: SplittablePaymentMethod, value: string) => void
  className?: string
}

export function buildPaymentSplitsFromAmounts(
  amounts: Partial<Record<SplittablePaymentMethod, string>>
): PaymentSplitInput[] {
  return (Object.entries(amounts) as Array<[SplittablePaymentMethod, string]>)
    .map(([method, raw]) => ({
      method,
      amount: roundMoney(Number(raw?.replace(',', '.') || 0)),
    }))
    .filter((split) => split.amount > 0)
}

export function PaymentSplitsEditor({
  total,
  methods,
  amounts,
  onChange,
  className,
}: PaymentSplitsEditorProps) {
  const splits = buildPaymentSplitsFromAmounts(amounts)
  const sum = sumSplitAmounts(splits)
  const remaining = roundMoney(total - sum)
  const matches = Math.abs(remaining) <= 0.02 && splits.length >= 2

  return (
    <div className={cn('space-y-3 rounded-lg border border-dashed border-[#7EB8B3]/60 bg-[#F7FBFA] p-3', className)}>
      <div>
        <p className="text-sm font-medium text-[#2D5A57]">Distribución del cobro</p>
        <p className="text-xs text-muted-foreground">
          Cargá cuánto va por cada medio. La suma debe dar {formatPrice(total)}.
        </p>
      </div>

      <div className="space-y-2">
        {methods.map((method) => (
          <div key={method} className="grid grid-cols-[1fr_7.5rem] items-center gap-2">
            <Label htmlFor={`split-${method}`} className="text-sm font-normal">
              {PAYMENT_METHOD_LABELS[method]}
            </Label>
            <Input
              id={`split-${method}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              value={amounts[method] ?? ''}
              onChange={(event) => onChange(method, event.target.value)}
              className="text-right tabular-nums"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Suma: {formatPrice(sum)}</span>
        <span
          className={cn(
            'font-medium',
            matches ? 'text-[#2D5A57]' : remaining === 0 && splits.length < 2 ? 'text-amber-700' : 'text-amber-700'
          )}
        >
          {matches
            ? 'Montos OK'
            : splits.length < 2 && Math.abs(remaining) <= 0.02
              ? 'Usá al menos 2 medios'
              : `Falta ${formatPrice(Math.abs(remaining))}${remaining < 0 ? ' de más' : ''}`}
        </span>
      </div>
    </div>
  )
}
