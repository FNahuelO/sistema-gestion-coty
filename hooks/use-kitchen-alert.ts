'use client'

import { useStaffOpsAlerts } from '@/hooks/use-staff-ops-alerts'

/**
 * Badge de cocina sin montar el poll pesado de `/api/orders`.
 * Usa un count liviano; se pausa cuando la sección cocina ya está activa.
 */
export function useKitchenAlert(isKitchenActive: boolean) {
  const { kitchenPending } = useStaffOpsAlerts()

  return {
    showKitchenAlert: kitchenPending > 0 && !isKitchenActive,
    pendingKitchenCount: kitchenPending,
  }
}
