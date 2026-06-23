export type MercadoPagoReturnStatus = 'approved' | 'pending' | 'failure'

export const MP_PENDING_ORDER_KEY = 'coty-mp-pending-order'
export const MP_REDIRECTING_KEY = 'coty-mp-redirecting'

export type MpPendingOrder = {
  orderId: string
  trackingProof: string
  publicTrackingCode?: string
  displayCode?: string
  startedAt: number
}

type SearchParamsLike = {
  get(name: string): string | null
}

export function parseMercadoPagoReturnStatus(params: SearchParamsLike): MercadoPagoReturnStatus | null {
  const collectionStatus = params.get('collection_status')?.toLowerCase()
  const status = params.get('status')?.toLowerCase()

  if (collectionStatus === 'approved' || status === 'approved') return 'approved'
  if (collectionStatus === 'pending' || collectionStatus === 'in_process' || status === 'pending') {
    return 'pending'
  }
  if (
    collectionStatus === 'rejected' ||
    collectionStatus === 'failure' ||
    status === 'failure' ||
    status === 'rejected'
  ) {
    return 'failure'
  }

  return null
}

export function getMercadoPagoReturnOrderId(params: SearchParamsLike): string | null {
  return params.get('orderId')?.trim() || params.get('external_reference')?.trim() || null
}

export function buildOrderStatusReturnUrl(params: SearchParamsLike, fallbackOrderId?: string | null) {
  const orderId = getMercadoPagoReturnOrderId(params) ?? fallbackOrderId ?? undefined
  const paymentStatus = parseMercadoPagoReturnStatus(params)
  const search = new URLSearchParams()

  if (paymentStatus === 'approved') search.set('status', 'approved')
  if (paymentStatus === 'pending') search.set('status', 'pending')

  if (orderId) search.set('orderId', orderId)

  const paymentId = params.get('payment_id') || params.get('collection_id')
  if (paymentId) search.set('payment_id', paymentId)

  const query = search.toString()
  return query ? `/order-status?${query}` : '/order-status'
}

export function buildCheckoutFailureReturnUrl(orderId?: string | null) {
  const search = new URLSearchParams({ status: 'failure' })
  if (orderId) search.set('orderId', orderId)
  return `/checkout?${search.toString()}`
}

export function shouldRedirectCheckoutToOrderStatus(params: SearchParamsLike) {
  const paymentStatus = parseMercadoPagoReturnStatus(params)
  return paymentStatus === 'approved' || paymentStatus === 'pending'
}

export function rememberMpPendingOrder(order: Omit<MpPendingOrder, 'startedAt'>) {
  if (typeof window === 'undefined') return
  const payload: MpPendingOrder = { ...order, startedAt: Date.now() }
  window.sessionStorage.setItem(MP_PENDING_ORDER_KEY, JSON.stringify(payload))
}

export function getMpPendingOrder(): MpPendingOrder | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(MP_PENDING_ORDER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MpPendingOrder
  } catch {
    return null
  }
}

export function clearMpPendingOrder() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(MP_PENDING_ORDER_KEY)
}

export function markMpRedirecting() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(MP_REDIRECTING_KEY, '1')
}

export function clearMpRedirecting() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(MP_REDIRECTING_KEY)
}

const MP_RETURN_QUERY_PARAMS = [
  'status',
  'payment_id',
  'collection_status',
  'collection_id',
  'external_reference',
  'orderId',
  'preference_id',
  'merchant_order_id',
] as const

export const MP_RETURN_HANDLED_PREFIX = 'coty-mp-return-handled'

export function getMpReturnHandledKey(orderId: string | null, status: string) {
  return `${MP_RETURN_HANDLED_PREFIX}:${orderId ?? 'no-order'}:${status}`
}

export function wasMpReturnAlreadyHandled(orderId: string | null, status: string) {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(getMpReturnHandledKey(orderId, status)) === '1'
}

export function markMpReturnHandled(orderId: string | null, status: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(getMpReturnHandledKey(orderId, status), '1')
}

export function buildCleanUrlWithoutMpReturn(pathname: string, searchParams: SearchParamsLike & { entries?: () => IterableIterator<[string, string]> }) {
  const next = new URLSearchParams()

  if (typeof searchParams.entries === 'function') {
    for (const [key, value] of searchParams.entries()) {
      if (!(MP_RETURN_QUERY_PARAMS as readonly string[]).includes(key)) {
        next.set(key, value)
      }
    }
  }

  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}
