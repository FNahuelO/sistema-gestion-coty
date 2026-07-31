'use client'

import useSWR from 'swr'
import { POLL_SWR_DEFAULTS, usePollInterval } from '@/lib/swr-poll'

export type StaffOpsAlerts = {
  kitchenPending: number
  tableCallsPending: number
}

const fetchJson = async (url: string): Promise<StaffOpsAlerts> => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar alertas')
  return res.json()
}

/** Contadores livianos compartidos (SWR dedupe) para badges del panel staff. */
export function useStaffOpsAlerts(enabled = true) {
  const refreshInterval = usePollInterval(enabled ? 15_000 : 0)
  const { data, mutate, error, isLoading } = useSWR<StaffOpsAlerts>(
    enabled ? '/api/staff/alerts' : null,
    fetchJson,
    {
      ...POLL_SWR_DEFAULTS,
      refreshInterval,
    }
  )

  return {
    kitchenPending: data?.kitchenPending ?? 0,
    tableCallsPending: data?.tableCallsPending ?? 0,
    mutate,
    error,
    isLoading,
  }
}
