'use client'

import { useMemo } from 'react'
import type { CartItem, Promotion } from '@/lib/types'
import { getCartDiscountAmount, getCartSubtotal } from '@/lib/promotions'

export function useCartPricing(items: CartItem[], promotions: Promotion[]) {
  return useMemo(() => {
    const subtotal = getCartSubtotal(items, promotions)
    const discount = getCartDiscountAmount(items, promotions)
    return {
      subtotal,
      discount,
      total: subtotal,
    }
  }, [items, promotions])
}
