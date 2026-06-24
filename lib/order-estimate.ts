import type { CartItem, Order, OrderType } from '@/lib/types'

const MIN_ESTIMATE_MINUTES = 5

const SERVICE_BUFFER_MINUTES: Record<OrderType, number> = {
  table: 3,
  pickup: 5,
  delivery: 15,
}

export function getItemPreparationMinutes(item: CartItem): number {
  return Math.max(0, item.product.preparationTime ?? 0)
}

export function calculateEstimatedMinutesFromItems(
  items: CartItem[],
  orderType: OrderType = 'pickup'
): number {
  if (items.length === 0) return MIN_ESTIMATE_MINUTES

  const maxItemPrep = items.reduce(
    (max, item) => Math.max(max, getItemPreparationMinutes(item)),
    0
  )

  return Math.max(MIN_ESTIMATE_MINUTES, maxItemPrep + SERVICE_BUFFER_MINUTES[orderType])
}

export function calculateOrderEstimatedMinutes(order: Pick<Order, 'items' | 'type'>): number {
  return calculateEstimatedMinutesFromItems(order.items, order.type)
}

export function shouldShowOrderEstimate(status: Order['status']) {
  return status !== 'completed' && status !== 'delivered' && status !== 'cancelled'
}
