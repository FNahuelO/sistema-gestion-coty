'use client'

import { useStaffOpsAlerts } from '@/hooks/use-staff-ops-alerts'

/**
 * Indica si hay llamados de mesa activos para mostrar el punto verde en "Mozos".
 * Se oculta cuando la sección de llamados ya está activa.
 */
export function useCallsAlert(isCallsActive: boolean) {
  const { tableCallsPending } = useStaffOpsAlerts()

  return {
    showCallsAlert: tableCallsPending > 0 && !isCallsActive,
    pendingCallsCount: tableCallsPending,
  }
}
