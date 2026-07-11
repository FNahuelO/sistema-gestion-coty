'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem } from '@/lib/types'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { ProductImage } from '@/components/customer/product-image'

export function getCartItemUnitPrice(item: CartItem) {
  const optionsTotal =
    item.selectedOptions?.reduce((acc, opt) => {
      const productOpt = item.product.options?.find((o) => o.id === opt.optionId)
      return (
        acc +
        (productOpt?.choices
          .filter((c) => opt.choiceIds.includes(c.id))
          .reduce((sum, c) => sum + c.priceModifier, 0) || 0)
      )
    }, 0) || 0

  return item.product.price + optionsTotal
}

interface CartProductCardProps {
  item: CartItem
  index?: number
  variant?: 'search' | 'cart' | 'table'
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}

export function CartProductCard({
  item,
  variant = 'cart',
  onIncrease,
  onDecrease,
  onRemove,
}: CartProductCardProps) {
  const unitPrice = getCartItemUnitPrice(item)
  const optionsLabel =
    item.selectedOptions && item.selectedOptions.length > 0
      ? item.selectedOptions
          .map((opt) => {
            const productOpt = item.product.options?.find((o) => o.id === opt.optionId)
            return opt.choiceIds
              .map((cId) => productOpt?.choices.find((c) => c.id === cId)?.name)
              .join(', ')
          })
          .join(' • ')
      : null

  const description = optionsLabel || item.notes || item.product.description
  const lineTotal = unitPrice * item.quantity

  if (variant === 'table') {
    return (
      <article className="flex items-start gap-3 border-b border-black/8 py-3 last:border-b-0">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <img
            src={item.product.image}
            alt={item.product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight text-foreground">{item.product.name}</h3>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(lineTotal)}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className="inline-flex items-center overflow-hidden rounded-full"
            style={{ backgroundColor: COTY_QTY_BG }}
          >
            <button
              type="button"
              onClick={onDecrease}
              className="flex h-8 w-8 items-center justify-center text-[#2D5A57]"
              aria-label="Quitar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[24px] px-1 text-center text-xs font-medium text-[#2D5A57]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              className="flex h-8 w-8 items-center justify-center text-[#2D5A57]"
              aria-label="Agregar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 transition-colors hover:text-red-500"
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </article>
    )
  }

  const quantityControl =
    variant === 'search' ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          disabled={item.quantity === 0}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#2D5A57] transition-opacity disabled:opacity-40"
          style={{ backgroundColor: COTY_QTY_BG }}
          aria-label="Quitar"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-[#2D5A57]"
          style={{ backgroundColor: COTY_QTY_BG }}
        >
          {item.quantity}
        </div>
        <button
          type="button"
          onClick={onIncrease}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#2D5A57]"
          style={{ backgroundColor: COTY_QTY_BG }}
          aria-label="Agregar"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : (
      <div
        className="inline-flex items-center overflow-hidden rounded-full"
        style={{ backgroundColor: COTY_QTY_BG }}
      >
        <button
          type="button"
          onClick={onDecrease}
          className="flex h-8 w-9 items-center justify-center text-[#2D5A57]"
          aria-label="Quitar"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[28px] px-1 text-center text-sm font-medium text-[#2D5A57]">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          className="flex h-8 w-9 items-center justify-center text-[#2D5A57]"
          aria-label="Agregar"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    )

  return (
    <article className="flex gap-3 rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
      <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl md:h-[96px] md:w-[96px]">
        <ProductImage src={item.product.image} alt={item.product.name} className="rounded-xl" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-bold leading-tight text-foreground md:text-base">
          {item.product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground md:text-xs">
          {description}
        </p>
        <p className="mt-1.5 text-sm font-bold md:text-base">{formatPrice(unitPrice)}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          {quantityControl}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

interface CotySectionCardProps {
  icon: React.ReactNode
  title: React.ReactNode
  children: React.ReactNode
}

export function CotySectionCard({ icon, title, children }: CotySectionCardProps) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: COTY_TEAL }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 font-bold text-foreground">{title}</div>
          {children}
        </div>
      </div>
    </div>
  )
}
