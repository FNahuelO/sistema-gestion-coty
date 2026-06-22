import type { Order, OrderStatus, OrderType } from '@/lib/types'

export type OrderSortKey =
  | 'oldest'
  | 'newest'
  | 'status'
  | 'type'
  | 'total_desc'
  | 'total_asc'
  | 'items_desc'

export const ORDER_SORT_OPTIONS: { value: OrderSortKey; label: string }[] = [
  { value: 'oldest', label: 'Más antiguos primero' },
  { value: 'newest', label: 'Más recientes primero' },
  { value: 'status', label: 'Por estado' },
  { value: 'type', label: 'Por tipo (mesa → delivery → retiro)' },
  { value: 'total_desc', label: 'Mayor monto primero' },
  { value: 'total_asc', label: 'Menor monto primero' },
  { value: 'items_desc', label: 'Más ítems primero' },
]

const STATUS_WEIGHT: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  completed: 5,
  cancelled: 6,
}

const TYPE_WEIGHT: Record<OrderType, number> = {
  table: 0,
  delivery: 1,
  pickup: 2,
}

function toTimestamp(value: Date | string) {
  return new Date(value).getTime()
}

function countItems(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function sortOrders(orders: Order[], sortKey: OrderSortKey): Order[] {
  const sorted = [...orders]

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'newest':
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
      case 'status': {
        const byStatus = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]
        return byStatus !== 0 ? byStatus : toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
      }
      case 'type': {
        const byType = TYPE_WEIGHT[a.type] - TYPE_WEIGHT[b.type]
        return byType !== 0 ? byType : toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
      }
      case 'total_desc':
        return b.total - a.total || toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
      case 'total_asc':
        return a.total - b.total || toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
      case 'items_desc':
        return countItems(b) - countItems(a) || toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
      case 'oldest':
      default:
        return toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
    }
  })

  return sorted
}
