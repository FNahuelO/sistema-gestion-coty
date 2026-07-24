import type { Order, OrderType, PaymentMethod } from '@/lib/types'

export function requiresTransferProofApproval(
  paymentMethod: PaymentMethod,
  orderType: OrderType,
  hasTransferSplit = false
): boolean {
  if (orderType === 'table') return false
  if (paymentMethod === 'transfer') return true
  return paymentMethod === 'combined' && hasTransferSplit
}

export function canApproveTransferPayment(
  order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus' | 'type' | 'paymentSplits'>
): boolean {
  if (order.status !== 'pending' || order.paymentStatus !== 'pending' || order.type === 'table') {
    return false
  }
  if (order.paymentMethod === 'transfer') return true
  return (
    order.paymentMethod === 'combined' &&
    Boolean(order.paymentSplits?.some((split) => split.method === 'transfer' && split.amount > 0))
  )
}
