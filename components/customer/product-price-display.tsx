'use client'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/coty-theme'
import { getProductDiscountPercent } from '@/lib/promotions'
import type { Product, Promotion } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductPriceDisplayProps {
  product: Product
  promotions?: Promotion[]
  className?: string
  priceClassName?: string
}

export function ProductPriceDisplay({
  product,
  promotions = [],
  className,
  priceClassName = 'text-sm font-bold',
}: ProductPriceDisplayProps) {
  const discount = getProductDiscountPercent(product, promotions)

  if (discount > 0) {
    const discounted = product.price * (1 - discount / 100)
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <span className={priceClassName}>{formatPrice(discounted)}</span>
        <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
        <Badge className="h-5 bg-[#EAB308] px-1.5 text-[10px] text-white hover:bg-[#EAB308]">
          -{discount}%
        </Badge>
      </div>
    )
  }

  return <p className={cn(priceClassName, className)}>{formatPrice(product.price)}</p>
}
