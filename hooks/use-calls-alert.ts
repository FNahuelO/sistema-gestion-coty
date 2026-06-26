'use client'

import useSWR from 'swr'

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
  const { data } = useSWR<TableCall[]>('/api/table-calls', fetchJson, {
    refreshInterval: 5000,
  })

  const pendingCallsCount = data?.length ?? 0

  return {
    showCallsAlert: pendingCallsCount > 0 && !isCallsActive,
    pendingCallsCount,
  }
}
