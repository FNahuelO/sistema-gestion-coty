'use client'

import Link from 'next/link'
import { Search, X, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuCategoryNav } from '@/components/customer/menu-category-nav'
import { TableSessionBanner } from '@/components/customer/table-session-banner'
import { COTY_HEADER, COTY_TEAL, LOGO_SRC_SVG, formatPrice } from '@/lib/coty-theme'
import { useTableSession } from '@/lib/store'
import type { Category } from '@/lib/types'
import type { MenuCategoryId } from '@/lib/menu-categories'
import { cn } from '@/lib/utils'

interface MenuHeaderProps {
  searchQuery: string
  isSearchMode: boolean
  searchResultCount: number
  selectedCategory: MenuCategoryId
  categories: Category[]
  onSearchChange: (value: string) => void
  onCategorySelect: (categoryId: MenuCategoryId) => void
}

export function MenuHeader({
  searchQuery,
  isSearchMode,
  searchResultCount,
  selectedCategory,
  categories,
  onSearchChange,
  onCategorySelect,
}: MenuHeaderProps) {
  const { tableSession, isLoading, error } = useTableSession()
  const hasTableIndicator = isLoading || Boolean(tableSession) || Boolean(error)
  const isPromoPage = selectedCategory === 'promo'

  return (
    <div
      className="w-full rounded-b-4xl md:rounded-b-[2.5rem]"
      style={{ backgroundColor: COTY_HEADER }}
    >
      <div className="relative mx-auto w-full max-w-lg px-4 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-8">
        <header className="min-h-[207px] pt-6 md:min-h-0 md:pb-12 md:pt-8">
          <Link href="/" className="mb-4 flex justify-center md:hidden">
            <img
              src={LOGO_SRC_SVG}
              alt="Coty Café"
              className="h-16 w-auto object-contain mix-blend-screen"
            />
          </Link>

          <div className="relative md:mx-auto md:max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:h-5 md:w-5" />
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

          <TableSessionBanner variant="inline" />

          <div className={cn('pb-10 md:pb-0 md:text-center', hasTableIndicator ? 'mt-2' : 'mt-4')}>
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
            ) : isPromoPage ? (
              <h1 className="my-4 text-xl font-bold text-white md:text-2xl">Promos</h1>
            ) : hasTableIndicator ? null : (
              <h1 className="my-4 text-xl font-bold text-white md:text-2xl">Menú</h1>
            )}
          </div>
        </header>

        {!isSearchMode && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-1/2 px-4 md:px-6 lg:px-8">
            <div className="pointer-events-auto md:mx-auto md:max-w-4xl lg:max-w-5xl">
              <MenuCategoryNav categories={categories} selected={selectedCategory} onSelect={onCategorySelect} />
            </div>
          </div>
        )}
      </div>
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
    <div className="fixed bottom-[72px] left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 px-4 md:bottom-8 md:left-auto md:right-8 md:max-w-md md:translate-x-0 lg:right-12">
      <Link href="/checkout" prefetch={false}>
        <Button
          className="w-full gap-2 rounded-full py-6 shadow-lg md:py-5"
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
