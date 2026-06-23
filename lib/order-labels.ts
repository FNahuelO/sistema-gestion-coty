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
  waiting: 'Esperando pedido',
  finished: 'Finalizada',
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

const COLLECT_ON_DELIVERY_METHODS: Order['paymentMethod'][] = ['cash', 'card', 'transfer']

export function getPaymentStatusLabel(order: Pick<Order, 'paymentMethod' | 'paymentStatus'>): string {
  if (!order.paymentStatus) return ''
  if (
    order.paymentStatus === 'pending' &&
    COLLECT_ON_DELIVERY_METHODS.includes(order.paymentMethod)
  ) {
    return 'Pendiente de cobro'
  }
  return PAYMENT_STATUS_LABELS[order.paymentStatus]
}

const INTERNAL_CUSTOMER_PHONES = new Set(['mesa', 'staff'])

export function isDisplayableCustomerPhone(phone?: string | null): boolean {
  const value = phone?.trim()
  if (!value) return false
  if (INTERNAL_CUSTOMER_PHONES.has(value.toLowerCase())) return false

  const digits = value.replace(/\D/g, '')
  return digits.length >= 7
}

export function formatOrderStatus(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status]
}

export function formatTableStatus(status: TableStatus) {
  return TABLE_STATUS_LABELS[status]
}
