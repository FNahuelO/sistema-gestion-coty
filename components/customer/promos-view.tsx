'use client'

import { Percent, Star } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading'
import { MenuProductCarousel, MenuProductCarouselSkeleton } from '@/components/customer/menu-product-carousel'
import { MenuSectionHeader } from '@/components/customer/menu-section-header'
import { PromotionBanner } from '@/components/customer/promotion-banner'
import { getActivePromotions, getProductsForPromotion } from '@/lib/promotions'
import type { CartItem, Product, Promotion } from '@/lib/types'
import type { useCart } from '@/lib/store'

type PromosViewProps = {
  products: Product[]
  promotions: Promotion[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onOpenProduct: (product: Product) => void
}

export function PromosView({
  products,
  promotions,
  items,
  addItem,
  updateQuantity,
  onOpenProduct,
}: PromosViewProps) {
  const activePromotions = getActivePromotions(promotions)
  const promotionSections = activePromotions
    .map((promotion) => ({
      promotion,
      products: getProductsForPromotion(products, promotion),
    }))
    .filter((section) => section.products.length > 0)

  if (promotionSections.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="Sin promociones activas"
        description="Volvé pronto, estamos preparando nuevas ofertas para vos"
      />
    )
  }

  return (
    <div className="space-y-8">
      {promotionSections.map(({ promotion, products: promoProducts }) => (
        <section key={promotion.id} className="space-y-4">
          <PromotionBanner
            title={promotion.title}
            image={promotion.image}
            discount={promotion.discount}
            validTo={new Date(promotion.validTo)}
          />
          <MenuSectionHeader
            icon={<Star className="h-6 w-6 text-[#7EC8C4]" strokeWidth={1.75} />}
            name={promotion.title}
            count={promoProducts.length}
          />
          {promotion.description ? (
            <p className="-mt-1 text-sm leading-relaxed text-muted-foreground">{promotion.description}</p>
          ) : null}
          <div className="flex items-center gap-2 rounded-xl bg-[#F8FBFA] px-3 py-2 text-xs text-[#2D5A57] md:text-sm">
            <Percent className="h-4 w-4 shrink-0 text-[#7EB8B3]" />
            <span>{promotion.discount}% de descuento en los productos de esta promo</span>
          </div>
          <MenuProductCarousel
            products={promoProducts}
            items={items}
            promotions={promotions}
            addItem={addItem}
            updateQuantity={updateQuantity}
            onOpenProduct={onOpenProduct}
          />
        </section>
      ))}
    </div>
  )
}

export function PromosLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <LoadingSkeleton className="h-32 w-full rounded-2xl md:h-40" />
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-3 w-20" />
            </div>
          </div>
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
          <MenuProductCarouselSkeleton count={3} />
        </div>
      ))}
    </div>
  )
}
