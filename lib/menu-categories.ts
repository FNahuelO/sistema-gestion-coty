import type { Category, Product } from '@/lib/types'
import { getPromotedProducts } from '@/lib/promotions'
import type { Promotion } from '@/lib/types'

export type MenuCategoryId = 'all' | 'promo' | string

export interface MenuSection {
  id: string
  name: string
  icon: string
  products: Product[]
}

export function resolveMenuCategoryId(value: string | null): MenuCategoryId {
  if (!value || value === 'all') return 'all'
  if (value === 'promo') return 'promo'
  return value
}

export function buildMenuSections(
  products: Product[],
  categories: Category[],
  promotions: Promotion[] = []
): MenuSection[] {
  const available = products.filter((product) => product.available)
  const activeCategories = [...categories]
    .filter((category) => category.active !== false)
    .sort((left, right) => left.order - right.order)

  return activeCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      products: available.filter((product) => product.categoryId === category.id),
    }))
    .filter((section) => section.products.length > 0)
}

export function filterProductsByMenuCategory(
  products: Product[],
  menuCategoryId: MenuCategoryId,
  promotions: Promotion[] = []
): Product[] {
  const available = products.filter((product) => product.available)

  if (menuCategoryId === 'all') return available
  if (menuCategoryId === 'promo') return getPromotedProducts(available, promotions)

  return available.filter((product) => product.categoryId === menuCategoryId)
}

export function getMenuCategoryName(
  menuCategoryId: MenuCategoryId,
  categories: Category[]
): string | undefined {
  if (menuCategoryId === 'all') return undefined
  if (menuCategoryId === 'promo') return 'Promociones'
  return categories.find((category) => category.id === menuCategoryId)?.name
}
