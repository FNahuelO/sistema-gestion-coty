'use client'

import { useMemo } from 'react'
import { useOrders } from '@/lib/store'
import type { OrderStatus } from '@/lib/types'

const KITCHEN_ATTENTION_STATUSES: OrderStatus[] = ['pending', 'confirmed']

export function useKitchenAlert(isKitchenActive: boolean) {
  const { orders } = useOrders()

  const pendingKitchenCount = useMemo(
    () => orders.filter((order) => KITCHEN_ATTENTION_STATUSES.includes(order.status)).length,
    [orders]
  )

  return {
    showKitchenAlert: pendingKitchenCount > 0 && !isKitchenActive,
    pendingKitchenCount,
  }
}
