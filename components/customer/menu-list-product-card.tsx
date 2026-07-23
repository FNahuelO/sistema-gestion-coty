'use client'

import { Plus, Minus, Trash2 } from 'lucide-react'
import type { CartItem, Product, Promotion } from '@/lib/types'
import { useCart } from '@/lib/store'
import { COTY_QTY_BG } from '@/lib/coty-theme'
import { getDefaultCartItem } from '@/lib/menu-cart-utils'
import { ProductPriceDisplay } from '@/components/customer/product-price-display'
import { getProductDiscountPercent } from '@/lib/promotions'
import { Badge } from '@/components/ui/badge'
import { LoadingImage } from '@/components/shared/loading-image'

interface MenuListProductCardProps {
  product: Product
  promotions?: Promotion[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  removeItem: ReturnType<typeof useCart>['removeItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onOpenDetail: () => void
}

export function MenuListProductCard({
  product,
  promotions = [],
  items,
  addItem,
  removeItem,
  updateQuantity,
  onOpenDetail,
}: MenuListProductCardProps) {
  const cartItem = getDefaultCartItem(items, product.id)
  const quantity = cartItem?.quantity ?? 0
  const hasRequiredOptions = product.options?.some((option) => option.required)
  const discount = getProductDiscountPercent(product, promotions)

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

  const handleRemove = () => {
    if (cartItem) {
      removeItem(cartItem.id)
    }
  }

  return (
    <article className="flex gap-3 rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl md:h-[96px] md:w-[96px]"
      >
        <LoadingImage src={product.image} alt={product.name} />
        {discount > 0 && (
          <Badge className="absolute left-1 top-1 bg-[#EAB308] px-1 text-[9px] text-white hover:bg-[#EAB308]">
            Promo
          </Badge>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-bold leading-tight text-foreground md:text-base">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground md:text-xs">
          {product.description}
        </p>
        <div className="mt-1.5">
          <ProductPriceDisplay product={product} promotions={promotions} priceClassName="text-sm font-bold md:text-base" />
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div
            className="inline-flex items-center overflow-hidden rounded-full"
            style={{ backgroundColor: COTY_QTY_BG }}
          >
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity === 0}
              className="flex h-8 w-9 items-center justify-center text-[#2D5A57] transition-opacity disabled:opacity-40"
              aria-label="Quitar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[28px] px-1 text-center text-sm font-medium text-[#2D5A57]">
              {quantity || 0}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              className="flex h-8 w-9 items-center justify-center text-[#2D5A57]"
              aria-label="Agregar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {quantity > 0 && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Eliminar del carrito"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
