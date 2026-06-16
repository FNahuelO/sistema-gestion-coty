import type { Order, OrderStatus, OrderType, PaymentStatus, TableStatus } from '@/lib/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  waiting: 'Esperando',
  finished: 'Por cobrar',
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: 'Delivery',
  pickup: 'Recoger',
  table: 'Mesa',
}

export const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mercado_pago: 'Mercado Pago',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  requires_action: 'Requiere acción',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export function formatOrderStatus(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status]
}

export function formatTableStatus(status: TableStatus) {
  return TABLE_STATUS_LABELS[status]
}
