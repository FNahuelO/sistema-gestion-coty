import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import type { Order } from '@/lib/types'

type BrowserPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

const DEFAULT_VAPID_SUBJECT = 'mailto:notificaciones@cotycafe.app'

/**
 * Normaliza el VAPID subject. web-push exige que sea una URL válida (mailto: o
 * http/https) y lanza una excepción si no lo es, lo que romperia todo el envío.
 * Toleramos errores comunes de las variables de entorno: comillas envolventes,
 * espacios y un '=' inicial accidental al pegar el valor (VAPID_SUBJECT==mailto:).
 */
function normalizeVapidSubject(raw: string | undefined): string {
  if (!raw) return DEFAULT_VAPID_SUBJECT
  let value = raw.trim()
  value = value.replace(/^["']|["']$/g, '').trim()
  value = value.replace(/^=+/, '').trim()
  if (!value) return DEFAULT_VAPID_SUBJECT
  if (value.startsWith('mailto:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  // Un email suelto (sin el prefijo mailto:) es un error común: lo completamos.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `mailto:${value}`
  }
  console.warn(`[push] VAPID_SUBJECT inválido ("${raw}"); se usa el valor por defecto`)
  return DEFAULT_VAPID_SUBJECT
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim()
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim()
const VAPID_SUBJECT = normalizeVapidSubject(process.env.VAPID_SUBJECT)

let vapidConfigured = false

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY ?? null
}

function ensureVapidConfigured() {
  if (vapidConfigured) return true
  if (!isPushConfigured()) return false
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
    vapidConfigured = true
    return true
  } catch (error) {
    console.error('[push] No se pudo configurar VAPID (revisá VAPID_SUBJECT / claves):', error)
    return false
  }
}

/** Guarda (o actualiza) la suscripción push del navegador del cliente para un pedido. */
export async function savePushSubscription(orderId: string, subscription: BrowserPushSubscription) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) throw new Error('ORDER_NOT_FOUND')

  await prisma.pushSubscription.upsert({
    where: { orderId_endpoint: { orderId, endpoint: subscription.endpoint } },
    create: {
      orderId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })
}

async function sendOrderPush(orderId: string, payload: PushPayload) {
  if (!ensureVapidConfigured()) {
    console.warn('[push] VAPID no configurado (faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY); se omite el envío')
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { orderId } })
  if (subscriptions.length === 0) {
    console.info(`[push] pedido ${orderId}: sin suscripciones, no se envía nada`)
    return
  }

  console.info(`[push] pedido ${orderId}: enviando a ${subscriptions.length} suscripción(es) — "${payload.body}"`)

  const body = JSON.stringify(payload)
  const staleIds: string[] = []
  let sent = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        const result = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        )
        sent += 1
        console.info(`[push]   ✓ ${sub.endpoint.slice(0, 40)}… statusCode=${result.statusCode}`)
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        // 404/410 = suscripción vencida o revocada: la eliminamos para no reintentar.
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id)
          console.warn(`[push]   ⤫ ${sub.endpoint.slice(0, 40)}… vencida (statusCode=${statusCode}), se elimina`)
        } else {
          failed += 1
          const detail = (error as { body?: string })?.body
          console.error(`[push]   ✗ ${sub.endpoint.slice(0, 40)}… statusCode=${statusCode ?? 'N/A'} ${detail ?? error}`)
        }
      }
    })
  )

  console.info(`[push] pedido ${orderId}: ${sent} ok, ${staleIds.length} vencida(s), ${failed} con error`)

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {})
  }
}

type NotifiableOrder = Pick<Order, 'id' | 'displayCode' | 'dailyNumber' | 'publicTrackingCode' | 'status' | 'type' | 'estimatedMinutes'>

function getOrderCode(order: NotifiableOrder) {
  if (order.dailyNumber != null) return `#${order.dailyNumber}`
  return order.displayCode ?? order.publicTrackingCode ?? order.id.slice(0, 8).toUpperCase()
}

function getStatusMessage(order: NotifiableOrder): string | null {
  switch (order.status) {
    case 'confirmed':
      return 'Tu pedido fue confirmado. ¡Ya lo estamos preparando!'
    case 'preparing':
      return 'Manos a la obra: estamos preparando tu pedido.'
    case 'ready':
      if (order.type === 'delivery') return 'Tu pedido está listo y sale en camino.'
      if (order.type === 'pickup') return 'Tu pedido está listo para retirar.'
      return 'Tu pedido está listo.'
    case 'delivered':
      return '¡Tu pedido fue entregado! Buen provecho.'
    case 'cancelled':
      return 'Tu pedido fue cancelado.'
    default:
      return null
  }
}

/** Notifica al cliente un cambio de estado del pedido (no bloquea si algo falla). */
export async function notifyOrderStatusChanged(order: NotifiableOrder) {
  const message = getStatusMessage(order)
  if (!message) return

  await sendOrderPush(order.id, {
    title: `Pedido ${getOrderCode(order)}`,
    body: message,
    url: `/order-status?orderId=${order.id}`,
    tag: `order-${order.id}`,
  }).catch((error) => console.error('notifyOrderStatusChanged', error))
}

/** Notifica al cliente que se actualizó el tiempo estimado (por ejemplo, una demora). */
export async function notifyOrderEstimateChanged(order: NotifiableOrder) {
  if (typeof order.estimatedMinutes !== 'number' || order.estimatedMinutes <= 0) return

  await sendOrderPush(order.id, {
    title: `Pedido ${getOrderCode(order)}`,
    body: `Nuevo tiempo estimado: ${order.estimatedMinutes} min.`,
    url: `/order-status?orderId=${order.id}`,
    tag: `order-${order.id}`,
  }).catch((error) => console.error('notifyOrderEstimateChanged', error))
}
