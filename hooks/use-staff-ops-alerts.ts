'use client'

import useSWR from 'swr'
import { STAFF_POLL_BASE_MS, countStaffOpsAlerts } from '@/lib/adaptive-polling'
import { useAdaptiveRefreshInterval } from '@/hooks/use-adaptive-refresh-interval'
import { POLL_SWR_DEFAULTS } from '@/lib/swr-poll'
import { useBusinessIsOpen } from '@/lib/store'

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
  const isOpen = useBusinessIsOpen()
  const refreshInterval = useAdaptiveRefreshInterval<StaffOpsAlerts>(
    enabled ? STAFF_POLL_BASE_MS : 0,
    {
      enabled,
      isOpen,
      getActiveCount: countStaffOpsAlerts,
    }
  )
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
