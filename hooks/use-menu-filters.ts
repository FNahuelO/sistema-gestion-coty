'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import type { Category, Product, Promotion } from '@/lib/types'
import {
  buildMenuSections,
  filterProductsByMenuCategory,
  getMenuCategoryName,
  resolveMenuCategoryId,
  type MenuCategoryId,
} from '@/lib/menu-categories'

export function useMenuFilters(products: Product[], categories: Category[], promotions: Promotion[] = []) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const promoParam = searchParams.has('promo') || searchParams.get('category') === 'promo'
  const initialCategory = promoParam ? 'promo' : resolveMenuCategoryId(searchParams.get('category'))

  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryId>(initialCategory)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const isSearchMode = searchQuery.trim().length > 0

  useEffect(() => {
    setSelectedProduct(null)
  }, [pathname])

  useEffect(() => {
    setSearchQuery(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    if (!initialSearch) {
      setSelectedCategory(promoParam ? 'promo' : resolveMenuCategoryId(searchParams.get('category')))
    }
  }, [searchParams, initialSearch, promoParam])

  useEffect(() => {
    const productId = searchParams.get('product')
    if (!productId || products.length === 0) return
    const product = products.find((candidate) => candidate.id === productId)
    if (product) {
      setSelectedProduct(product)
    }
  }, [searchParams, products])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
        params.delete('category')
        params.delete('promo')
      } else {
        params.delete('search')
        if (selectedCategory === 'promo') {
          params.set('promo', '1')
          params.delete('category')
        } else if (selectedCategory !== 'all') {
          params.set('category', selectedCategory)
          params.delete('promo')
        } else {
          params.delete('category')
          params.delete('promo')
        }
      }

      const query = params.toString()
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
      if (`${window.location.pathname}${window.location.search}` !== newUrl) {
        window.history.replaceState(null, '', newUrl)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return products.filter(
      (product) =>
        product.available &&
        (product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query))
    )
  }, [products, searchQuery])

  const menuSections = useMemo(
    () => buildMenuSections(products, categories, promotions),
    [products, categories, promotions]
  )

  const categoryProducts = useMemo(
    () => filterProductsByMenuCategory(products, selectedCategory, promotions),
    [products, selectedCategory, promotions]
  )

  const activeCategoryName = getMenuCategoryName(selectedCategory, categories)

  const handleSearchChange = (value: string) => {
    setSelectedProduct(null)
    setSearchQuery(value)
  }

  const handleCategorySelect = (categoryId: MenuCategoryId) => {
    setSelectedProduct(null)
    setSearchQuery('')
    setSelectedCategory((current) => (current === categoryId ? 'all' : categoryId))
  }

  return {
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
  }
}
