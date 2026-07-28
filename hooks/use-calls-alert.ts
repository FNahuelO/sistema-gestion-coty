'use client'

import useSWR from 'swr'
import { useAdaptiveRefreshInterval } from '@/hooks/use-adaptive-refresh-interval'
import { useBusiness } from '@/lib/store'

type TableCall = { id: string }

const fetchJson = async (url: string): Promise<TableCall[]> => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

/**
 * Indica si hay llamados de mesa activos para mostrar el punto verde en "Mozos".
 * Se oculta cuando la sección de llamados ya está activa.
 */
export function useCallsAlert(isCallsActive: boolean) {
  const { settings, isLoading: settingsLoading } = useBusiness()
  const refreshInterval = useAdaptiveRefreshInterval<TableCall[]>(15000, {
    isOpen: settingsLoading ? null : settings.isOpen,
    getActiveCount: (data) => data?.length ?? 0,
  })
  const { data } = useSWR<TableCall[]>('/api/table-calls', fetchJson, {
    refreshInterval,
  })

  const pendingCallsCount = data?.length ?? 0

  return {
    showCallsAlert: pendingCallsCount > 0 && !isCallsActive,
    pendingCallsCount,
  }
}
