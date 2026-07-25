'use client'

import { Plus, Minus } from 'lucide-react'
import type { CartItem, Product, Promotion } from '@/lib/types'
import { useCart } from '@/lib/store'
import { COTY_TEAL } from '@/lib/coty-theme'
import { getDefaultCartItem } from '@/lib/menu-cart-utils'
import { ProductPriceDisplay } from '@/components/customer/product-price-display'
import { getProductDiscountPercent } from '@/lib/promotions'
import { Badge } from '@/components/ui/badge'
import { LoadingImage } from '@/components/shared/loading-image'

interface MenuGridProductCardProps {
  product: Product
  promotions?: Promotion[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onOpenDetail: () => void
}

function MenuGridQuantityControl({
  quantity,
  onIncrease,
  onDecrease,
}: {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-0 pt-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity === 0}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40 md:h-9 md:w-9"
        style={{ backgroundColor: COTY_TEAL }}
        aria-label="Quitar"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative mx-1 flex min-w-[72px] items-center justify-center md:min-w-[80px]">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#2D5A57]/30" />
        <span className="relative bg-white px-2 text-sm font-medium text-foreground md:text-base">
          {quantity || ''}
        </span>
      </div>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white md:h-9 md:w-9"
        style={{ backgroundColor: COTY_TEAL }}
        aria-label="Agregar"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function MenuGridProductCard({
  product,
  promotions = [],
  items,
  addItem,
  updateQuantity,
  onOpenDetail,
}: MenuGridProductCardProps) {
  const cartItem = getDefaultCartItem(items, product.id)
  const quantity = cartItem?.quantity ?? 0
  const hasRequiredOptions = product.options?.some((option) => option.required)
  const discount = getProductDiscountPercent(product, promotions)
  const isFeatured = product.featured

  const handleIncrease = () => {
    if (hasRequiredOptions) {
      onOpenDetail()
      return
    }
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity + 1)
      return
    }
    addItem(product, 1, [])
  }

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity - 1)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
      <button type="button" onClick={onOpenDetail} className="relative aspect-square overflow-hidden text-left">
        <LoadingImage src={product.image} alt={product.name} />
        {(discount > 0 || isFeatured) && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-[#EAB308] text-[10px] text-white hover:bg-[#EAB308]">Promo</Badge>
            )}
            {isFeatured && (
              <Badge className="bg-[#2D5A57] text-[10px] text-white hover:bg-[#2D5A57]">Destacado</Badge>
            )}
          </div>
        )}
      </button>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-bold leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-2">
          <ProductPriceDisplay product={product} promotions={promotions} />
        </div>
        <div className="mt-auto pt-2">
          <MenuGridQuantityControl
            quantity={quantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
          />
        </div>
      </div>
    </div>
  )
}
