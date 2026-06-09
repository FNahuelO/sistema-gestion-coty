'use client'

import type { CartItem, Product } from '@/lib/types'
import { useCart } from '@/lib/store'
import { EmptyState } from '@/components/shared/empty-state'
import { MenuSectionHeader } from '@/components/customer/menu-section-header'
import { MenuGridProductCard } from '@/components/customer/menu-grid-product-card'
import { MenuListProductCard } from '@/components/customer/menu-list-product-card'
import { MENU_SECTION_ICONS } from '@/lib/menu-section-icons'
import type { MenuCategoryId } from '@/lib/menu-categories'
import { cn } from '@/lib/utils'

interface MenuSection {
  id: Exclude<MenuCategoryId, 'all'>
  name: string
  products: Product[]
}

interface MenuContentProps {
  isSearchMode: boolean
  searchResults: Product[]
  selectedCategory: MenuCategoryId
  menuSections: MenuSection[]
  categoryProducts: Product[]
  activeCategoryName?: string
  items: CartItem[]
  addItem: ReturnType<typeof useCart>['addItem']
  removeItem: ReturnType<typeof useCart>['removeItem']
  updateQuantity: ReturnType<typeof useCart>['updateQuantity']
  onSearchClear: () => void
  onCategoryReset: () => void
  onOpenProduct: (product: Product) => void
}

export function MenuContent({
  isSearchMode,
  searchResults,
  selectedCategory,
  menuSections,
  categoryProducts,
  activeCategoryName,
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
        'relative z-10 mx-auto max-w-lg rounded-t-[1.75rem] bg-white px-4 md:rounded-t-4xl',
        isSearchMode ? '-mt-1 py-4' : '-mt-2 pt-14 pb-4',
      )}
    >
      {isSearchMode ? (
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
    <div className="space-y-3">
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
        const Icon = MENU_SECTION_ICONS[section.id]
        return (
          <section key={section.id} className="space-y-4">
            <MenuSectionHeader
              icon={<Icon className="h-6 w-6 text-[#7EC8C4]" strokeWidth={1.75} />}
              name={section.name}
              count={section.products.length}
            />
            <div className="grid grid-cols-2 gap-3">
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
  products,
  items,
  addItem,
  removeItem,
  updateQuantity,
  onCategoryReset,
  onOpenProduct,
}: {
  categoryId: Exclude<MenuCategoryId, 'all'>
  categoryName?: string
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

  const Icon = MENU_SECTION_ICONS[categoryId]

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
      <div className="space-y-3">
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
