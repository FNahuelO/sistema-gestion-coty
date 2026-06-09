import type { Product } from '@/lib/types'

export type MenuCategoryId =
  | 'all'
  | 'coffee'
  | 'cold'
  | 'sandwiches'
  | 'starters'
  | 'burgers'
  | 'milanesas'

export interface MenuCategoryConfig {
  id: Exclude<MenuCategoryId, 'all'>
  name: string
  catalogIds: string[]
  keywords?: string[]
}

export const MENU_CATEGORIES: MenuCategoryConfig[] = [
  {
    id: 'coffee',
    name: 'Cafetería',
    catalogIds: ['coffee', 'specialty', 'tea', 'pastry'],
  },
  {
    id: 'cold',
    name: 'Tragos y Milkshakes',
    catalogIds: ['cold'],
  },
  {
    id: 'sandwiches',
    name: 'Sándwiches',
    catalogIds: ['food'],
    keywords: ['sandwich', 'sándwich', 'bagel', 'toast'],
  },
  {
    id: 'starters',
    name: 'Entradas',
    catalogIds: ['food'],
    keywords: ['entrada', 'avocado', 'toast'],
  },
  {
    id: 'burgers',
    name: 'Hamburguesas',
    catalogIds: ['food'],
    keywords: ['burger', 'hamburguesa'],
  },
  {
    id: 'milanesas',
    name: 'Milanesas',
    catalogIds: ['food'],
    keywords: ['milanesa'],
  },
]

const LEGACY_CATEGORY_MAP: Record<string, MenuCategoryId> = {
  coffee: 'coffee',
  specialty: 'coffee',
  tea: 'coffee',
  pastry: 'coffee',
  cold: 'cold',
  food: 'all',
  dessert: 'all',
}

export function resolveMenuCategoryId(value: string | null): MenuCategoryId {
  if (!value || value === 'all') return 'all'
  if (MENU_CATEGORIES.some((category) => category.id === value)) {
    return value as MenuCategoryId
  }
  return LEGACY_CATEGORY_MAP[value] ?? 'all'
}

export function filterProductsByMenuCategory(
  products: Product[],
  menuCategoryId: MenuCategoryId
): Product[] {
  const available = products.filter((product) => product.available)

  if (menuCategoryId === 'all') return available

  const config = MENU_CATEGORIES.find((category) => category.id === menuCategoryId)
  if (!config) {
    return available.filter((product) => product.categoryId === menuCategoryId)
  }

  const filtered = available.filter((product) => {
    if (!config.catalogIds.includes(product.categoryId)) return false
    if (!config.keywords?.length) return true
    const text = `${product.name} ${product.description}`.toLowerCase()
    return config.keywords.some((keyword) => text.includes(keyword))
  })

  if (filtered.length === 0 && config.catalogIds.includes('food')) {
    return available.filter((product) => product.categoryId === 'food')
  }

  return filtered
}

export function getMenuCategoryConfig(menuCategoryId: MenuCategoryId) {
  if (menuCategoryId === 'all') return null
  return MENU_CATEGORIES.find((category) => category.id === menuCategoryId) ?? null
}
