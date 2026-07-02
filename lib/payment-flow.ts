import type { Order, OrderType, PaymentMethod } from '@/lib/types'

export function requiresTransferProofApproval(
  paymentMethod: PaymentMethod,
  orderType: OrderType
): boolean {
  return paymentMethod === 'transfer' && orderType !== 'table'
}

export function canApproveTransferPayment(
  order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus' | 'type'>
): boolean {
  return (
    order.status === 'pending' &&
    order.paymentMethod === 'transfer' &&
    order.paymentStatus === 'pending' &&
    order.type !== 'table'
  )
}
