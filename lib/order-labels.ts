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
  pickup: 'Retiro en local',
  table: 'Mesa',
}

/** Etiqueta corta y gritona para cocina / cards (Mesa 4, Delivery, Retiro). */
export function getOrderChannelLabel(order: Pick<Order, 'type' | 'tableNumber'>): string {
  if (order.type === 'table') {
    return order.tableNumber != null ? `Mesa ${order.tableNumber}` : 'Mesa'
  }
  if (order.type === 'delivery') return 'Delivery'
  return 'Retiro'
}

export const ORDER_TYPE_BADGE_CLASS: Record<OrderType, string> = {
  table: 'border-[#2D5A57] bg-[#2D5A57] text-white',
  delivery: 'border-[#E8A598] bg-[#FCECE8] text-[#8B4A3C]',
  pickup: 'border-[#7EB8B3] bg-[#E7F4F2] text-[#2D5A57]',
}

export const ORDER_TYPE_CARD_ACCENT: Record<OrderType, string> = {
  table: 'border-l-[#2D5A57] bg-[#F3F8F7]',
  delivery: 'border-l-[#E8A598]',
  pickup: 'border-l-[#7EB8B3]',
}

export const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia (WhatsApp)',
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

const COLLECT_ON_DELIVERY_METHODS: Order['paymentMethod'][] = ['cash', 'card']

export function getPaymentStatusLabel(order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'status'>): string {
  if (!order.paymentStatus) return ''
  if (
    order.paymentStatus === 'pending' &&
    order.paymentMethod === 'transfer' &&
    order.status === 'pending'
  ) {
    return 'Esperando comprobante'
  }
  if (
    order.paymentStatus === 'pending' &&
    COLLECT_ON_DELIVERY_METHODS.includes(order.paymentMethod)
  ) {
    return 'Pendiente de cobro'
  }
  return PAYMENT_STATUS_LABELS[order.paymentStatus]
}

const INTERNAL_CUSTOMER_PHONES = new Set(['mesa', 'staff', 'mostrador'])

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

/** Número corto interno de cocina del día (#12). Solo para staff/cocina. */
export function formatOrderNumber(
  order: Pick<Order, 'dailyNumber' | 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  if (order.dailyNumber != null) return `#${order.dailyNumber}`
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}

/** Número interno sin #. Solo para staff/cocina/tickets de cocina. */
export function getOrderNumberText(
  order: Pick<Order, 'dailyNumber' | 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  if (order.dailyNumber != null) return String(order.dailyNumber)
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}

/** Código público del pedido para el cliente (nunca el número diario interno). */
export function formatPublicOrderCode(
  order: Pick<Order, 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}
