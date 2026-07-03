export type PushConfig = {
  enabled: boolean
  publicKey: string | null
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function fetchPushConfig(): Promise<PushConfig> {
  try {
    const res = await fetch('/api/push/vapid')
    if (!res.ok) return { enabled: false, publicKey: null }
    return (await res.json()) as PushConfig
  } catch {
    return { enabled: false, publicKey: null }
  }
}

/**
 * Pide permiso, se suscribe al push del navegador y registra la suscripción en
 * el servidor asociada al pedido. Devuelve true si quedó suscripto.
 */
export async function subscribeToOrderPush(orderId: string, publicKey: string): Promise<boolean> {
  if (!isPushSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, subscription: subscription.toJSON() }),
  })

  return res.ok
}
