/** Intervalo máximo de polling adaptativo (sigue detectando reapertura / nuevos pedidos). */
export const ADAPTIVE_POLLING_MAX_MS = 120_000

const ACTIVE_ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
])

export type AdaptivePollingInput = {
  /** Intervalo base en ms (p. ej. 15000). */
  baseMs: number
  /** Unidades de trabajo activo detectadas en la última respuesta. */
  activeCount?: number
  /**
   * Estado del local. Si está cerrado y no hay actividad, el polling baja al mínimo.
   * `null`/`undefined` = desconocido (no fuerza modo idle).
   */
  isOpen?: boolean | null
  /** Pestaña en segundo plano: multiplica el factor. */
  isDocumentHidden?: boolean
}

/**
 * Calcula un refreshInterval según el tráfico observado.
 *
 * - mucho (≥3 activos): intervalo base
 * - poco (1–2): ~2× más lento
 * - vacío + abierto/desconocido: ~3×
 * - vacío + cerrado: ~8×
 * - pestaña oculta: ×2 adicional (tope 2 min)
 */
export function adaptiveRefreshInterval({
  baseMs,
  activeCount = 0,
  isOpen,
  isDocumentHidden = false,
}: AdaptivePollingInput): number {
  if (baseMs <= 0) return 0

  let factor = 1
  if (activeCount <= 0) {
    factor = isOpen === false ? 8 : 3
  } else if (activeCount <= 2) {
    factor = 2
  }

  if (isDocumentHidden) {
    factor *= 2
  }

  return Math.min(Math.round(baseMs * factor), ADAPTIVE_POLLING_MAX_MS)
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
