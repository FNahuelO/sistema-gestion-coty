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

/**
 * Devuelve el tiempo estimado que ve el cliente. Prioriza el valor cargado
 * manualmente por el personal al confirmar el pedido y, si no existe, cae en
 * el cálculo automático a partir de los tiempos de preparación.
 */
export function getOrderEstimatedMinutes(
  order: Pick<Order, 'items' | 'type' | 'estimatedMinutes'>
): number {
  if (typeof order.estimatedMinutes === 'number' && order.estimatedMinutes > 0) {
    return Math.round(order.estimatedMinutes)
  }
  return calculateOrderEstimatedMinutes(order)
}

export function shouldShowOrderEstimate(status: Order['status']) {
  return status !== 'completed' && status !== 'delivered' && status !== 'cancelled'
}

/**
 * Momento objetivo en el que el pedido debería estar listo. Es el ancla del
 * contador regresivo: si el personal actualiza el tiempo estimado, el servidor
 * recalcula `estimatedReadyAt` desde ese instante. Si nunca se cargó un tiempo
 * manual, caemos en `createdAt` + estimación automática.
 */
export function getOrderEstimatedReadyAt(
  order: Pick<Order, 'items' | 'type' | 'estimatedMinutes' | 'estimatedReadyAt' | 'createdAt'>
): Date {
  if (order.estimatedReadyAt) {
    return order.estimatedReadyAt instanceof Date
      ? order.estimatedReadyAt
      : new Date(order.estimatedReadyAt)
  }

  const minutes = getOrderEstimatedMinutes(order)
  const base = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
  return new Date(base.getTime() + minutes * 60_000)
}
