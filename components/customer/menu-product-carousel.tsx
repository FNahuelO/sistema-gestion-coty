'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { MenuGridProductCard } from '@/components/customer/menu-grid-product-card'
import { cn } from '@/lib/utils'
import type { CartItem, Product, Promotion } from '@/lib/types'
import type { useCart } from '@/lib/store'

const NAV_BUTTON_CLASS =
  'border-[#2D5A57]/20 bg-white text-[#2D5A57] shadow-md hover:bg-white disabled:opacity-30'

interface MenuProductCarouselProps {
  products: Product[]
  items: CartItem[]
  promotions: Promotion[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onOpenProduct: (product: Product) => void
  className?: string
}

export function MenuProductCarousel({
  products,
  items,
  promotions,
  addItem,
  updateQuantity,
  onOpenProduct,
  className,
}: MenuProductCarouselProps) {
  if (products.length === 0) return null

  return (
    <Carousel
      opts={{ align: 'start', loop: false, dragFree: true }}
      className={cn('relative -mx-4 px-10 md:mx-0 md:px-8', className)}
    >
      <CarouselContent className="-ml-3 items-stretch">
        {products.map((product) => (
          <CarouselItem
            key={product.id}
            className="basis-[82%] pl-3 sm:basis-[62%] md:basis-[46%] lg:basis-[36%]"
          >
            <MenuGridProductCard
              product={product}
              promotions={promotions}
              items={items}
              addItem={addItem}
              updateQuantity={updateQuantity}
              onOpenDetail={() => onOpenProduct(product)}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {products.length > 1 ? (
        <>
          <CarouselPrevious
            className={cn('top-[36%] left-0 h-9 w-9 -translate-y-1/2', NAV_BUTTON_CLASS)}
          />
          <CarouselNext
            className={cn('top-[36%] right-0 h-9 w-9 -translate-y-1/2', NAV_BUTTON_CLASS)}
          />
        </>
      ) : null}
    </Carousel>
  )
}

export function MenuProductCarouselSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-10 md:mx-0 md:px-8">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-[82%] shrink-0 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm sm:w-[62%] md:w-[46%]"
        >
          <div className="aspect-square animate-pulse bg-[#F8FBFA]" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#F8FBFA]" />
            <div className="h-3 w-full animate-pulse rounded bg-[#F8FBFA]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#F8FBFA]" />
          </div>
        </div>
      ))}
    </div>
  )
}
