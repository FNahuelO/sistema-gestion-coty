'use client'

import type { CartItem, Product } from '@/lib/types'
import { useCart } from '@/lib/store'
import { EmptyState } from '@/components/shared/empty-state'
import { CartItemSkeleton, LoadingSkeleton, ProductCardSkeleton } from '@/components/shared/loading'
import { MenuSectionHeader } from '@/components/customer/menu-section-header'
import { MenuGridProductCard } from '@/components/customer/menu-grid-product-card'
import { MenuListProductCard } from '@/components/customer/menu-list-product-card'
import { getCategoryIcon } from '@/lib/category-icons'
import type { MenuCategoryId, MenuSection } from '@/lib/menu-categories'
import { cn } from '@/lib/utils'

interface MenuContentProps {
  isLoading: boolean
  isSearchMode: boolean
  searchResults: Product[]
  selectedCategory: MenuCategoryId
  menuSections: MenuSection[]
  categoryProducts: Product[]
  activeCategoryName?: string
  activeCategoryIcon?: string
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  removeItem: ReturnType<typeof useCart>['removeItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onSearchClear: () => void
  onCategoryReset: () => void
  onOpenProduct: (product: Product) => void
}

export function MenuContent({
  isLoading,
  isSearchMode,
  searchResults,
  selectedCategory,
  menuSections,
  categoryProducts,
  activeCategoryName,
  activeCategoryIcon,
  items,
  addItem,
  removeItem,
  updateQuantity,
  onSearchClear,
  onCategoryReset,
  onOpenProduct,
}: MenuContentProps) {
  return (
    <main
      className={cn(
        'relative z-10 mx-auto w-full max-w-lg rounded-t-[1.75rem] bg-white px-4 md:max-w-4xl md:rounded-t-4xl md:px-6 lg:max-w-6xl lg:px-8',
        isSearchMode ? '-mt-1 py-4 md:py-6' : '-mt-2 pt-14 pb-4 md:pt-16 md:pb-8',
      )}
    >
      {isLoading ? (
        <MenuLoadingSkeleton
          variant={isSearchMode || selectedCategory !== 'all' ? 'list' : 'grid'}
        />
      ) : isSearchMode ? (
        <SearchResults
          results={searchResults}
          items={items}
          addItem={addItem}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          onSearchClear={onSearchClear}
          onOpenProduct={onOpenProduct}
        />
      ) : selectedCategory === 'all' ? (
        <AllCategoriesView
          menuSections={menuSections}
          items={items}
          addItem={addItem}
          updateQuantity={updateQuantity}
          onOpenProduct={onOpenProduct}
        />
      ) : (
        <SingleCategoryView
          categoryId={selectedCategory}
          categoryName={activeCategoryName}
          categoryIcon={activeCategoryIcon}
          products={categoryProducts}
          items={items}
          addItem={addItem}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          onCategoryReset={onCategoryReset}
          onOpenProduct={onOpenProduct}
        />
      )}
    </main>
  )
}

function MenuLoadingSkeleton({ variant }: { variant: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <CartItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchResults({
  results,
  items,
  addItem,
  removeItem,
  updateQuantity,
  onSearchClear,
  onOpenProduct,
}: {
  results: Product[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  removeItem: ReturnType<typeof useCart>['removeItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onSearchClear: () => void
  onOpenProduct: (product: Product) => void
}) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="Sin resultados"
        description="No encontramos productos que coincidan con tu búsqueda"
        action={{ label: 'Ver todo el menú', onClick: onSearchClear }}
      />
    )
  }

  return (
    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
      {results.map((product) => (
        <MenuListProductCard
          key={product.id}
          product={product}
          items={items}
          addItem={addItem}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          onOpenDetail={() => onOpenProduct(product)}
        />
      ))}
    </div>
  )
}

function AllCategoriesView({
  menuSections,
  items,
  addItem,
  updateQuantity,
  onOpenProduct,
}: {
  menuSections: MenuSection[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onOpenProduct: (product: Product) => void
}) {
  if (menuSections.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="Menú vacío"
        description="No hay productos disponibles en este momento"
      />
    )
  }

  return (
    <div className="space-y-8">
      {menuSections.map((section) => {
        const Icon = getCategoryIcon(section.icon)
        return (
          <section key={section.id} className="space-y-4">
            <MenuSectionHeader
              icon={<Icon className="h-6 w-6 text-[#7EC8C4]" strokeWidth={1.75} />}
              name={section.name}
              count={section.products.length}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {section.products.map((product) => (
                <MenuGridProductCard
                  key={product.id}
                  product={product}
                  items={items}
                  addItem={addItem}
                  updateQuantity={updateQuantity}
                  onOpenDetail={() => onOpenProduct(product)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SingleCategoryView({
  categoryId,
  categoryName,
  categoryIcon,
  products,
  items,
  addItem,
  removeItem,
  updateQuantity,
  onCategoryReset,
  onOpenProduct,
}: {
  categoryId: MenuCategoryId
  categoryName?: string
  categoryIcon?: string
  products: Product[]
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  removeItem: ReturnType<typeof useCart>['removeItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onCategoryReset: () => void
  onOpenProduct: (product: Product) => void
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="Sin productos"
        description={`No hay productos en ${categoryName ?? 'esta categoría'}`}
        action={{ label: 'Ver todo el menú', onClick: onCategoryReset }}
      />
    )
  }

  const Icon = getCategoryIcon(categoryId === 'promo' ? 'Star' : categoryIcon ?? 'UtensilsCrossed')

  return (
    <>
      {categoryName && (
        <MenuSectionHeader
          icon={<Icon className="h-7 w-7 text-[#7EC8C4]" strokeWidth={1.75} />}
          name={categoryName}
          count={products.length}
          className="mb-4"
        />
      )}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
        {products.map((product) => (
          <MenuListProductCard
            key={product.id}
            product={product}
            items={items}
            addItem={addItem}
            removeItem={removeItem}
            updateQuantity={updateQuantity}
            onOpenDetail={() => onOpenProduct(product)}
          />
        ))}
      </div>
    </>
  )
}
