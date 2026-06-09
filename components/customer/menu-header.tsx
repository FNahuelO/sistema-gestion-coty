'use client'

import Link from 'next/link'
import { Search, X, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuCategoryNav } from '@/components/customer/menu-category-nav'
import { COTY_HEADER, COTY_TEAL, LOGO_SRC_SVG, formatPrice } from '@/lib/coty-theme'
import type { MenuCategoryId } from '@/lib/menu-categories'

interface MenuHeaderProps {
  searchQuery: string
  isSearchMode: boolean
  searchResultCount: number
  selectedCategory: MenuCategoryId
  onSearchChange: (value: string) => void
  onCategorySelect: (categoryId: MenuCategoryId) => void
}

export function MenuHeader({
  searchQuery,
  isSearchMode,
  searchResultCount,
  selectedCategory,
  onSearchChange,
  onCategorySelect,
}: MenuHeaderProps) {
  return (
    <div className="relative mx-auto max-w-lg">
      <header
        className="min-h-[207px] rounded-b-4xl px-4 pt-6 md:rounded-b-[2.5rem]"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <Link href="/" className="mb-4 flex justify-center">
          <img
            src={LOGO_SRC_SVG}
            alt="Coty Café"
            className="w-auto h-full object-contain mix-blend-screen"
          />
        </Link>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-white py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-gray-400 focus:outline-none md:py-3.5 md:text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 pb-10">
          {isSearchMode ? (
            <>
              <h1 className="text-base font-bold text-white md:text-lg">
                Resultados para &ldquo;{searchQuery.trim()}&rdquo;
              </h1>
              <p className="mt-0.5 text-sm text-white/75">
                {searchResultCount}{' '}
                {searchResultCount === 1 ? 'producto encontrado' : 'productos encontrados'}
              </p>
            </>
          ) : (
            <h1 className="text-xl font-bold my-4 text-white md:text-2xl">Menú</h1>
          )}
        </div>
      </header>

      {!isSearchMode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-1/2 px-4">
          <div className="pointer-events-auto">
            <MenuCategoryNav selected={selectedCategory} onSelect={onCategorySelect} />
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuCartBarProps {
  itemCount: number
  total: number
}

export function MenuCartBar({ itemCount, total }: MenuCartBarProps) {
  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-[72px] left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 px-4">
      <Link href="/checkout" prefetch={false}>
        <Button
          className="w-full gap-2 rounded-full py-6 shadow-lg"
          style={{ backgroundColor: COTY_TEAL }}
        >
          <ShoppingBag className="h-5 w-5" />
          Ver pedido ({itemCount})
          <span className="ml-auto font-bold">{formatPrice(total)}</span>
        </Button>
      </Link>
    </div>
  )
}
