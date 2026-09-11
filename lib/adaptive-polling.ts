import { arHour } from '@/lib/datetime'

/** Intervalo máximo de polling adaptativo (sigue detectando reapertura / nuevos pedidos). */
export const ADAPTIVE_POLLING_MAX_MS = 300_000

/** Madrugada AR: reduce presión de polling en plan Hobby. */
export const QUIET_HOUR_START = 1
export const QUIET_HOUR_END = 7

/** Pedidos, cocina, mesas y alertas: 20s en hora pico (antes 15s). */
export const STAFF_POLL_BASE_MS = 20_000
/** Delivery / tracking: un poco más holgado. */
export const DELIVERY_POLL_BASE_MS = 30_000
export const TRACKING_POLL_BASE_MS = 30_000
/** Caja no necesita el mismo ritmo que cocina. */
export const CASH_POLL_BASE_MS = 45_000
/** Analytics del admin: un snapshot cada 2 min alcanza. */
export const ANALYTICS_POLL_BASE_MS = 120_000

const ACTIVE_ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
])

export type AdaptivePollingInput = {
  /** Intervalo base en ms (p. ej. 20000). */
  baseMs: number
  /** Unidades de trabajo activo detectadas en la última respuesta. */
  activeCount?: number
  /**
   * Estado del local. Si está cerrado y no hay actividad, el polling baja al mínimo.
   * `null`/`undefined` = desconocido (no fuerza modo idle).
   */
  isOpen?: boolean | null
  /** Pestaña en segundo plano: corta el polling (no suma CPU). */
  isDocumentHidden?: boolean
  /** Para tests: instante usado en horas valle. */
  now?: Date
}

/**
 * Calcula un refreshInterval según el tráfico observado.
 *
 * - mucho (≥3 activos): intervalo base
 * - poco (1–2): ~2× más lento
 * - vacío + abierto/desconocido: ~4×
 * - vacío + cerrado: ~12× (tope 5 min)
 * - pestaña oculta: 0
 * - madrugada AR (01–07): ×4 (mín. 2 min, tope 5 min)
 */
export function adaptiveRefreshInterval({
  baseMs,
  activeCount = 0,
  isOpen,
  isDocumentHidden = false,
  now,
}: AdaptivePollingInput): number {
  if (baseMs <= 0) return 0
  if (isDocumentHidden) return 0

  let factor = 1
  if (activeCount <= 0) {
    factor = isOpen === false ? 12 : 4
  } else if (activeCount <= 2) {
    factor = 2
  }

  const ms = Math.min(Math.round(baseMs * factor), ADAPTIVE_POLLING_MAX_MS)
  return applyQuietHours(ms, now)
}

/** ×4 de madrugada (mín. 2 min), sin pasar el tope adaptativo. */
export function applyQuietHours(ms: number, now = new Date()): number {
  if (ms <= 0) return 0
  const hour = arHour(now)
  if (hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END) {
    return Math.min(Math.max(ms * 4, 120_000), ADAPTIVE_POLLING_MAX_MS)
  }
  return ms
}

export function countActiveOrders(
  orders?: Array<{ status: string }> | null
): number {
  if (!orders?.length) return 0
  return orders.reduce((count, order) => count + (ACTIVE_ORDER_STATUSES.has(order.status) ? 1 : 0), 0)
}

export function countBusyTables(
  tables?: Array<{ status: string }> | null
): number {
  if (!tables?.length) return 0
  return tables.reduce((count, table) => {
    const busy = table.status === 'occupied' || table.status === 'waiting'
    return count + (busy ? 1 : 0)
  }, 0)
}

export function countActiveDeliveryEntries(
  entries?: Array<{ orderStatus: string; assignmentStatus: string }> | null
): number {
  if (!entries?.length) return 0
  return entries.reduce((count, entry) => {
    if (entry.assignmentStatus === 'delivered') return count
    if (entry.orderStatus === 'completed' || entry.orderStatus === 'cancelled') return count
    return count + 1
  }, 0)
}

export function countStaffOpsAlerts(
  data?: { kitchenPending?: number; tableCallsPending?: number } | null
): number {
  if (!data) return 0
  return (data.kitchenPending ?? 0) + (data.tableCallsPending ?? 0)
}
