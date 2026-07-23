import type { Order, OrderStatus, OrderType } from '@/lib/types'

export type OrderSortKey =
  | 'priority'
  | 'number'
  | 'oldest'
  | 'newest'
  | 'status'
  | 'type'
  | 'total_desc'
  | 'total_asc'
  | 'items_desc'

export const ORDER_SORT_OPTIONS: { value: OrderSortKey; label: string }[] = [
  { value: 'priority', label: 'Prioridad (mesa primero)' },
  { value: 'number', label: 'Por número (#1, #2…)' },
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

function compareByDailyNumber(a: Order, b: Order) {
  const aNum = a.dailyNumber ?? Number.MAX_SAFE_INTEGER
  const bNum = b.dailyNumber ?? Number.MAX_SAFE_INTEGER
  if (aNum !== bNum) return aNum - bNum
  return toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
}

export function sortOrders(orders: Order[], sortKey: OrderSortKey): Order[] {
  const sorted = [...orders]

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'priority': {
        const byType = TYPE_WEIGHT[a.type] - TYPE_WEIGHT[b.type]
        if (byType !== 0) return byType
        return compareByDailyNumber(a, b)
      }
      case 'number':
        return compareByDailyNumber(a, b)
      case 'newest':
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
      case 'status': {
        const byStatus = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]
        return byStatus !== 0 ? byStatus : compareByDailyNumber(a, b)
      }
      case 'type': {
        const byType = TYPE_WEIGHT[a.type] - TYPE_WEIGHT[b.type]
        return byType !== 0 ? byType : compareByDailyNumber(a, b)
      }
      case 'total_desc':
        return b.total - a.total || compareByDailyNumber(a, b)
      case 'total_asc':
        return a.total - b.total || compareByDailyNumber(a, b)
      case 'items_desc':
        return countItems(b) - countItems(a) || compareByDailyNumber(a, b)
      case 'oldest':
      default:
        return toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
    }
  })

  return sorted
}
