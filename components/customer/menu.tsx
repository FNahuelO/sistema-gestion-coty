'use client'

import { useCart, useCatalog } from '@/lib/store'
import { useMenuFilters } from '@/hooks/use-menu-filters'
import { MenuHeader, MenuCartBar } from '@/components/customer/menu-header'
import { MenuContent } from '@/components/customer/menu-content'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'

export function MenuPage() {
  const { products, isLoading } = useCatalog()
  const { items, itemCount, total, addItem, removeItem, updateQuantity } = useCart()

  const {
    selectedCategory,
    searchQuery,
    selectedProduct,
    setSelectedProduct,
    isSearchMode,
    searchResults,
    menuSections,
    categoryProducts,
    activeCategoryConfig,
    handleSearchChange,
    handleCategorySelect,
  } = useMenuFilters(products)

  return (
    <div className="coly-landing min-h-screen bg-white pb-24">
      <MenuHeader
        searchQuery={searchQuery}
        isSearchMode={isSearchMode}
        searchResultCount={searchResults.length}
        selectedCategory={selectedCategory}
        onSearchChange={handleSearchChange}
        onCategorySelect={handleCategorySelect}
      />

      <MenuContent
        isLoading={isLoading}
        isSearchMode={isSearchMode}
        searchResults={searchResults}
        selectedCategory={selectedCategory}
        menuSections={menuSections}
        categoryProducts={categoryProducts}
        activeCategoryName={activeCategoryConfig?.name}
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
