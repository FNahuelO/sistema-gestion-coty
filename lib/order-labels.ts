import type { Order, OrderStatus, OrderType, PaymentStatus, TableStatus } from '@/lib/types'
import { operationalDayKey } from '@/lib/datetime'

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
  combined: 'Pago combinado',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  requires_action: 'Requiere acción',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const COLLECT_ON_DELIVERY_METHODS: Order['paymentMethod'][] = ['cash', 'card', 'combined']

export function getPaymentStatusLabel(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'status' | 'paymentSplits'>
): string {
  if (!order.paymentStatus) return ''
  const hasTransferSplit = Boolean(order.paymentSplits?.some((split) => split.method === 'transfer'))
  if (
    order.paymentStatus === 'pending' &&
    order.status === 'pending' &&
    (order.paymentMethod === 'transfer' || (order.paymentMethod === 'combined' && hasTransferSplit))
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

export function isDisplayableCustomerPhone(phone?: string | null): phone is string {
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

/** Número corto interno del día (#12). Correlativo único mesa+delivery+retiro. Solo staff/cocina. */
export function formatOrderNumber(
  order: Pick<Order, 'dailyNumber' | 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  if (order.dailyNumber != null) return `#${order.dailyNumber}`
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}

/** Número interno sin #. Correlativo único del día para todos los canales. */
export function getOrderNumberText(
  order: Pick<Order, 'dailyNumber' | 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  if (order.dailyNumber != null) return String(order.dailyNumber)
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}

/** Resumen del correlativo del día (todos los canales juntos). */
export function getDailyOrderControlSummary(
  orders: Array<Pick<Order, 'dailyNumber' | 'type' | 'status' | 'createdAt'>>,
  dayKey = operationalDayKey(new Date())
) {
  const todays = orders.filter(
    (order) => operationalDayKey(order.createdAt) === dayKey && order.status !== 'cancelled'
  )
  const lastNumber = todays.reduce(
    (max, order) => Math.max(max, order.dailyNumber ?? 0),
    0
  )

  return {
    dayKey,
    lastNumber,
    total: todays.length,
    table: todays.filter((order) => order.type === 'table').length,
    delivery: todays.filter((order) => order.type === 'delivery').length,
    pickup: todays.filter((order) => order.type === 'pickup').length,
  }
}

/** Código público del pedido para el cliente (nunca el número diario interno). */
export function formatPublicOrderCode(
  order: Pick<Order, 'displayCode' | 'publicTrackingCode' | 'id'>
): string {
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}
