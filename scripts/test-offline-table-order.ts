/**
 * Verificación rápida del flujo offline de pedidos de mesa.
 * Ejecutar: npx tsx scripts/test-offline-table-order.ts
 */
import {
  enqueueOfflineOrder,
  getOfflineOrderQueue,
  queuedEntryToOrder,
  type CreateOrderPayload,
} from '../lib/offline-order-queue'

const OFFLINE_QUEUE_KEY = 'coty-cafe-offline-order-queue'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

// Simular entorno browser para localStorage
const storage = new Map<string, string>()
;(globalThis as { window?: Window }).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  },
  dispatchEvent: () => true,
} as unknown as Window

const payload: CreateOrderPayload = {
  type: 'table',
  paymentMethod: 'cash',
  customerName: 'Mesa 3',
  customerPhone: '',
  tableId: 'table-test-1',
  items: [
    {
      productId: 'prod-1',
      quantity: 2,
      selectedOptions: [],
    },
  ],
}

const entry = enqueueOfflineOrder({
  kind: 'table',
  tableId: 'table-test-1',
  tableNumber: 3,
  payload,
})

assert(entry.tableId === 'table-test-1', 'La entrada en cola debe conservar tableId')
assert(entry.kind === 'table', 'La entrada debe ser de tipo table')

const order = queuedEntryToOrder(entry)
assert(order.tableId === 'table-test-1', 'El pedido convertido debe tener tableId')
assert(order.tableNumber === 3, 'El pedido convertido debe tener tableNumber')
assert(order.offlinePending === true, 'El pedido offline debe marcarse como pendiente')
assert(order.type === 'table', 'El pedido debe ser de tipo mesa')

const queue = getOfflineOrderQueue()
assert(queue.length === 1, 'Debe haber 1 pedido en la cola')
assert(queue[0]?.id === entry.id, 'El pedido en cola debe coincidir con el encolado')

// Simular filtro de sessionOrders (tables-section)
const sessionOrders = [order].filter(
  (candidate) =>
    candidate.tableId === 'table-test-1' && !['completed', 'cancelled'].includes(candidate.status)
)
assert(sessionOrders.length === 1, 'El pedido offline debe aparecer en pedidos de sesión de mesa')

const accumulatedTotal = sessionOrders.reduce((sum, candidate) => sum + candidate.total, 0)
assert(sessionOrders.length === 1, 'Debe haber exactamente un pedido en sesión para calcular total')

console.log('OK: flujo offline de pedidos de mesa verificado')
console.log(`  - Pedido: ${order.displayCode}, total: ${order.total}, mesa: ${order.tableNumber}`)
