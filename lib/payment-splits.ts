import { z } from 'zod'
import type { PaymentMethod } from '@/lib/types'

/** Medios que pueden formar parte de un pago combinado (no el propio "combined"). */
export type SplittablePaymentMethod = Exclude<PaymentMethod, 'combined'>

export const SPLITTABLE_PAYMENT_METHODS: SplittablePaymentMethod[] = [
  'cash',
  'card',
  'transfer',
  'mercado_pago',
]

export type PaymentSplitInput = {
  method: SplittablePaymentMethod
  amount: number
}

export const paymentSplitSchema = z.object({
  method: z.enum(['cash', 'card', 'transfer', 'mercado_pago']),
  amount: z.number().positive(),
})

export const paymentSplitsSchema = z.array(paymentSplitSchema).min(2)

const MONEY_TOLERANCE = 0.02

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function sumSplitAmounts(splits: Array<{ amount: number }>): number {
  return roundMoney(splits.reduce((sum, split) => sum + split.amount, 0))
}

export function normalizePaymentSplits(splits: PaymentSplitInput[]): PaymentSplitInput[] {
  const byMethod = new Map<SplittablePaymentMethod, number>()
  for (const split of splits) {
    const amount = roundMoney(split.amount)
    if (amount <= 0) continue
    byMethod.set(split.method, roundMoney((byMethod.get(split.method) ?? 0) + amount))
  }
  return [...byMethod.entries()].map(([method, amount]) => ({ method, amount }))
}

export function assertPaymentSplitsMatchTotal(
  total: number,
  splits: PaymentSplitInput[],
  options?: { requireMultiple?: boolean }
): PaymentSplitInput[] {
  const normalized = normalizePaymentSplits(splits)
  if (options?.requireMultiple !== false && normalized.length < 2) {
    throw new Error('PAYMENT_SPLITS_REQUIRED')
  }
  if (normalized.length === 0) {
    throw new Error('PAYMENT_SPLITS_REQUIRED')
  }
  const sum = sumSplitAmounts(normalized)
  if (Math.abs(sum - roundMoney(total)) > MONEY_TOLERANCE) {
    throw new Error('PAYMENT_SPLITS_MISMATCH')
  }
  return normalized
}

/** Reparte montos de un cobro combinado entre varios pedidos (p. ej. mesa). */
export function allocateSplitsAcrossOrders(
  orderTotals: Array<{ id: string; total: number }>,
  splits: PaymentSplitInput[]
): Array<{ orderId: string; splits: PaymentSplitInput[] }> {
  const normalized = normalizePaymentSplits(splits)
  const grandTotal = roundMoney(orderTotals.reduce((sum, order) => sum + order.total, 0))
  if (grandTotal <= 0 || orderTotals.length === 0) {
    return orderTotals.map((order) => ({ orderId: order.id, splits: [] }))
  }

  const result = orderTotals.map((order) => ({
    orderId: order.id,
    splits: [] as PaymentSplitInput[],
  }))

  for (const split of normalized) {
    let remaining = split.amount
    orderTotals.forEach((order, index) => {
      const isLast = index === orderTotals.length - 1
      const share = isLast
        ? roundMoney(remaining)
        : roundMoney((split.amount * order.total) / grandTotal)
      remaining = roundMoney(remaining - share)
      if (share > 0) {
        result[index].splits.push({ method: split.method, amount: share })
      }
    })
  }

  return result
}

export function uiPaymentMethodToPrisma(
  method: PaymentMethod | SplittablePaymentMethod
): 'CASH' | 'CARD' | 'TRANSFER' | 'MERCADO_PAGO' | 'COMBINED' {
  switch (method) {
    case 'card':
      return 'CARD'
    case 'transfer':
      return 'TRANSFER'
    case 'mercado_pago':
      return 'MERCADO_PAGO'
    case 'combined':
      return 'COMBINED'
    default:
      return 'CASH'
  }
}

export function formatPaymentSplitsLabel(
  splits: PaymentSplitInput[] | undefined,
  labels: Record<SplittablePaymentMethod, string>
): string | null {
  if (!splits?.length) return null
  return splits
    .map((split) => `${labels[split.method]} $${split.amount.toFixed(2)}`)
    .join(' + ')
}
