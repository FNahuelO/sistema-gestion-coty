'use client'

import { useMemo } from 'react'
import { useCart, useCatalog } from '@/lib/store'
import { useMenuFilters } from '@/hooks/use-menu-filters'
import { useCartPricing } from '@/hooks/use-cart-pricing'
import { MenuHeader, MenuCartBar } from '@/components/customer/menu-header'
import { MenuContent } from '@/components/customer/menu-content'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'
import { TableSessionBanner } from '@/components/customer/table-session-banner'

export function MenuPage() {
  const { products, categories, promotions, isLoading } = useCatalog()
  const { items, itemCount, addItem, removeItem, updateQuantity } = useCart()
  const { total } = useCartPricing(items, promotions)

  const {
    selectedCategory,
    searchQuery,
    selectedProduct,
    setSelectedProduct,
    isSearchMode,
    searchResults,
    menuSections,
    categoryProducts,
    activeCategoryName,
    handleSearchChange,
    handleCategorySelect,
  } = useMenuFilters(products, categories, promotions)

  const activeCategoryIcon = useMemo(() => {
    if (selectedCategory === 'promo') return 'Star'
    return categories.find((category) => category.id === selectedCategory)?.icon
  }, [categories, selectedCategory])

  return (
    <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
      <MenuHeader
        searchQuery={searchQuery}
        isSearchMode={isSearchMode}
        searchResultCount={searchResults.length}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategorySelect={handleCategorySelect}
      />

      <div className="mx-auto max-w-lg px-4 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-8">
        <TableSessionBanner className="-mt-2 mb-4 md:-mt-4" />
      </div>

      <MenuContent
        isLoading={isLoading}
        isSearchMode={isSearchMode}
        searchResults={searchResults}
        selectedCategory={selectedCategory}
        menuSections={menuSections}
        categoryProducts={categoryProducts}
        activeCategoryName={activeCategoryName}
        activeCategoryIcon={activeCategoryIcon}
        promotions={promotions}
        items={items}
        addItem={addItem}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        onSearchClear={() => handleSearchChange('')}
        onCategoryReset={() => handleCategorySelect('all')}
        onOpenProduct={setSelectedProduct}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          promotions={promotions}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, quantity, options, notes) => {
            addItem(product, quantity, options, notes)
            setSelectedProduct(null)
          }}
        />
      )}

      <MenuCartBar itemCount={itemCount} total={total} />
    </div>
  )
}
