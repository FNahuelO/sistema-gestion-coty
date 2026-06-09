'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import type { Product } from '@/lib/types'
import {
  MENU_CATEGORIES,
  filterProductsByMenuCategory,
  getMenuCategoryConfig,
  resolveMenuCategoryId,
  type MenuCategoryId,
} from '@/lib/menu-categories'

export function useMenuFilters(products: Product[]) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCategory = resolveMenuCategoryId(searchParams.get('category'))

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
      setSelectedCategory(resolveMenuCategoryId(searchParams.get('category')))
    }
  }, [searchParams, initialSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
        params.delete('category')
      } else {
        params.delete('search')
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory)
        } else {
          params.delete('category')
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

  const menuSections = useMemo(() => {
    return MENU_CATEGORIES.map((category) => ({
      ...category,
      products: filterProductsByMenuCategory(products, category.id),
    })).filter((section) => section.products.length > 0)
  }, [products])

  const categoryProducts = useMemo(
    () => filterProductsByMenuCategory(products, selectedCategory),
    [products, selectedCategory]
  )

  const activeCategoryConfig =
    selectedCategory !== 'all' ? getMenuCategoryConfig(selectedCategory) : null

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
    activeCategoryConfig,
    handleSearchChange,
    handleCategorySelect,
  }
}
