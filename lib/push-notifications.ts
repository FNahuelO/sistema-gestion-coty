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

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim()
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim()
const VAPID_SUBJECT = process.env.VAPID_SUBJECT?.trim() || 'mailto:notificaciones@cotycafe.app'

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
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
  vapidConfigured = true
  return true
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
  if (!ensureVapidConfigured()) return

  const subscriptions = await prisma.pushSubscription.findMany({ where: { orderId } })
  if (subscriptions.length === 0) return

  const body = JSON.stringify(payload)
  const staleIds: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        )
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        // 404/410 = suscripción vencida o revocada: la eliminamos para no reintentar.
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id)
        } else {
          console.error('web-push sendNotification', statusCode ?? error)
        }
      }
    })
  )

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {})
  }
}

type NotifiableOrder = Pick<Order, 'id' | 'displayCode' | 'publicTrackingCode' | 'status' | 'type' | 'estimatedMinutes'>

function getOrderCode(order: NotifiableOrder) {
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
    url: '/order-status',
    tag: `order-${order.id}`,
  }).catch((error) => console.error('notifyOrderStatusChanged', error))
}

/** Notifica al cliente que se actualizó el tiempo estimado (por ejemplo, una demora). */
export async function notifyOrderEstimateChanged(order: NotifiableOrder) {
  if (typeof order.estimatedMinutes !== 'number' || order.estimatedMinutes <= 0) return

  await sendOrderPush(order.id, {
    title: `Pedido ${getOrderCode(order)}`,
    body: `Nuevo tiempo estimado: ${order.estimatedMinutes} min.`,
    url: '/order-status',
    tag: `order-${order.id}`,
  }).catch((error) => console.error('notifyOrderEstimateChanged', error))
}
