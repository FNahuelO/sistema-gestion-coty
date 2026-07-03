'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { COTY_HEADER } from '@/lib/coty-theme'
import { fetchPushConfig, isPushSupported, subscribeToOrderPush } from '@/lib/push-client'

const SUBSCRIBED_KEY = 'coty-push-subscribed-orders'

function getSubscribedOrders(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(SUBSCRIBED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function markSubscribed(orderId: string) {
  if (typeof window === 'undefined') return
  const current = new Set(getSubscribedOrders())
  current.add(orderId)
  window.localStorage.setItem(SUBSCRIBED_KEY, JSON.stringify([...current]))
}

export function OrderNotificationsButton({ orderId }: { orderId: string }) {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    setSupported(true)
    setPermission(Notification.permission)
    setSubscribed(getSubscribedOrders().includes(orderId))
    void fetchPushConfig().then((config) => {
      setEnabled(config.enabled)
      setPublicKey(config.publicKey)
    })
  }, [orderId])

  if (!supported || !enabled) return null

  const alreadyOn = subscribed && permission === 'granted'
  const denied = permission === 'denied'

  const handleEnable = async () => {
    if (!publicKey || loading) return
    setLoading(true)
    try {
      const ok = await subscribeToOrderPush(orderId, publicKey)
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default')
      if (ok) {
        markSubscribed(orderId)
        setSubscribed(true)
        toast.success('Listo, te avisaremos cuando cambie el estado de tu pedido')
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        toast.error('Activá las notificaciones desde los ajustes de tu navegador')
      } else {
        toast.error('No pudimos activar las notificaciones')
      }
    } catch {
      toast.error('No pudimos activar las notificaciones')
    } finally {
      setLoading(false)
    }
  }

  if (alreadyOn) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <BellRing className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium text-emerald-900">
          Avisos activados. Te notificaremos cuando avance tu pedido.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#E8E4DF] bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Recibí avisos del pedido</p>
          <p className="text-xs text-muted-foreground">
            {denied
              ? 'Bloqueaste las notificaciones. Activalas desde los ajustes de tu navegador.'
              : 'Te avisamos cuando lo confirmemos, esté en preparación o listo.'}
          </p>
        </div>
      </div>

      {!denied ? (
        <button
          type="button"
          onClick={() => void handleEnable()}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: COTY_HEADER }}
        >
          <Bell className="h-4 w-4" />
          {loading ? 'Activando...' : 'Activar notificaciones'}
        </button>
      ) : null}
    </div>
  )
}
