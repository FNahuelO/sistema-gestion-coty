'use client'

import useSWR from 'swr'
import { useAdaptiveRefreshInterval } from '@/hooks/use-adaptive-refresh-interval'
import { useBusiness } from '@/lib/store'

type KitchenAlertData = { count: number }

const fetchJson = async (url: string): Promise<KitchenAlertData> => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

/**
 * Badge de cocina sin montar el poll pesado de `/api/orders`.
 * Usa un count liviano; se pausa cuando la sección cocina ya está activa.
 */
export function useKitchenAlert(isKitchenActive: boolean) {
  const { settings, isLoading: settingsLoading } = useBusiness()
  const refreshInterval = useAdaptiveRefreshInterval<KitchenAlertData>(30000, {
    enabled: !isKitchenActive,
    isOpen: settingsLoading ? null : settings.isOpen,
    getActiveCount: (data) => data?.count ?? 0,
  })

  const { data } = useSWR<KitchenAlertData>(
    isKitchenActive ? null : '/api/staff/operations?view=kitchen-alert',
    fetchJson,
    { refreshInterval }
  )

  const pendingKitchenCount = data?.count ?? 0

  return {
    showKitchenAlert: pendingKitchenCount > 0 && !isKitchenActive,
    pendingKitchenCount,
  }
}
