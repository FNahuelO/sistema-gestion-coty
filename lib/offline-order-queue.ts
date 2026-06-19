import type { CartItem, Order, OrderType, PaymentMethod, Product } from '@/lib/types'
import { getOfflineCache, OFFLINE_CACHE_KEYS } from '@/lib/offline-cache'
import { getDiscountedUnitPrice } from '@/lib/promotions'
import { parsePromotion } from './offline-order-queue-helpers'

export const OFFLINE_QUEUE_KEY = 'coty-cafe-offline-order-queue'
export const OFFLINE_QUEUE_CHANGED_EVENT = 'coty-offline-queue-changed'
export const OFFLINE_ORDERS_SYNCED_EVENT = 'coty-orders-synced'

export type CreateOrderItemInput = {
  productId: string
  quantity: number
  selectedOptions: { optionId: string; choiceIds: string[] }[]
  notes?: string
}

export type CreateOrderPayload = {
  type: Order['type']
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerAddress?: string
  tableId?: string
  deliveryZoneId?: string
  discountCode?: string
  tip?: number
  notes?: string
  items: CreateOrderItemInput[]
}

export type OrderQueueSnapshot = {
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  customerName: string
  customerPhone: string
  customerAddress?: string
  tableNumber?: number
  type: OrderType
  paymentMethod: PaymentMethod
  notes?: string
}

export type QueuedOrderEntry = {
  id: string
  kind: 'customer' | 'table'
  payload: CreateOrderPayload
  tableId?: string
  snapshot: OrderQueueSnapshot
  createdAt: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
  retries: number
}

type CatalogCache = {
  settings: { taxRate?: number; deliveryFee?: number } | null
  products: Product[]
  promotions: Array<{ validFrom: string | Date; validTo: string | Date; active: boolean; discount: number; productIds?: string[]; categoryIds?: string[] }>
}

function notifyQueueChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT))
}

function readQueue(): QueuedOrderEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedOrderEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedOrderEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  notifyQueueChanged()
}

export function getOfflineOrderQueue() {
  return readQueue()
}

export function getPendingOfflineOrders() {
  return readQueue().filter((entry) => entry.status === 'pending' || entry.status === 'failed')
}

function buildSnapshot(
  payload: CreateOrderPayload,
  options?: { tableNumber?: number }
): OrderQueueSnapshot {
  const catalog = getOfflineCache<CatalogCache>(OFFLINE_CACHE_KEYS.catalog)
  const settings = catalog?.settings
  const taxRate = settings?.taxRate ?? 0.16
  const deliveryFee = payload.type === 'delivery' ? (settings?.deliveryFee ?? 0) : 0
  const promotions = (catalog?.promotions ?? []).map((promotion) => parsePromotion(promotion))

  const items: CartItem[] = payload.items.map((item, index) => {
    const product =
      catalog?.products.find((candidate) => candidate.id === item.productId) ??
      ({
        id: item.productId,
        name: 'Producto',
        description: '',
        price: 0,
        image: '',
        categoryId: '',
        featured: false,
        available: true,
        preparationTime: 0,
        options: [],
      } satisfies Product)

    return {
      id: `queued-${index}`,
      product,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
      notes: item.notes,
    }
  })

  const subtotal = items.reduce(
    (sum, item) =>
      sum + getDiscountedUnitPrice(item.product, item.selectedOptions, promotions) * item.quantity,
    0
  )
  const tax = subtotal * taxRate
  const total = subtotal + tax + deliveryFee

  return {
    items,
    subtotal,
    tax,
    deliveryFee,
    total,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    tableNumber: options?.tableNumber,
    type: payload.type,
    paymentMethod: payload.paymentMethod,
    notes: payload.notes,
  }
}

export function enqueueOfflineOrder(input: {
  kind: 'customer' | 'table'
  payload: CreateOrderPayload
  tableId?: string
  tableNumber?: number
}): QueuedOrderEntry {
  const entry: QueuedOrderEntry = {
    id: crypto.randomUUID(),
    kind: input.kind,
    payload: input.payload,
    tableId: input.tableId,
    snapshot: buildSnapshot(input.payload, { tableNumber: input.tableNumber }),
    createdAt: Date.now(),
    status: 'pending',
    retries: 0,
  }

  writeQueue([...readQueue(), entry])
  return entry
}

export function queuedEntryToOrder(entry: QueuedOrderEntry): Order {
  const code = `PND-${entry.id.slice(0, 8).toUpperCase()}`
  const { snapshot } = entry

  return {
    id: entry.id,
    displayCode: code,
    publicTrackingCode: code,
    type: snapshot.type,
    status: 'pending',
    items: snapshot.items,
    subtotal: snapshot.subtotal,
    tax: snapshot.tax,
    deliveryFee: snapshot.deliveryFee,
    total: snapshot.total,
    paymentMethod: snapshot.paymentMethod,
    paymentStatus: 'pending',
    customerName: snapshot.customerName,
    customerPhone: snapshot.customerPhone,
    customerAddress: snapshot.customerAddress,
    tableId: entry.tableId,
    tableNumber: snapshot.tableNumber,
    notes: snapshot.notes,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.createdAt),
    offlinePending: true,
  }
}

export function markQueueEntrySyncing(id: string) {
  writeQueue(
    readQueue().map((entry) => (entry.id === id ? { ...entry, status: 'syncing' as const, error: undefined } : entry))
  )
}

export function markQueueEntryFailed(id: string, error: string) {
  writeQueue(
    readQueue().map((entry) =>
      entry.id === id
        ? { ...entry, status: 'failed' as const, error, retries: entry.retries + 1 }
        : entry
    )
  )
}

export function removeQueueEntry(id: string) {
  writeQueue(readQueue().filter((entry) => entry.id !== id))
}

export function clearFailedQueueEntries() {
  writeQueue(readQueue().filter((entry) => entry.status !== 'failed'))
}
