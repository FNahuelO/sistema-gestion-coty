import type { CartItem } from '@/lib/types'

export function getDefaultCartItem(items: CartItem[], productId: string) {
  return items.find(
    (item) => item.product.id === productId && item.selectedOptions.length === 0 && !item.notes
  )
}
