import type { ProductOption, TableStatus, User } from '@/lib/types'

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'promotions'
  | 'tables'
  | 'users'
  | 'schedules'
  | 'cash'
  | 'commerce'
  | 'settings'

export type FormSection = Exclude<AdminSection, 'dashboard'>

export type ProductFormState = {
  id?: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  featured: boolean
  available: boolean
  preparationTime: number
  trackStock: boolean
  stock: number
  lowStockThreshold: number
  options: ProductOption[]
}

export type CategoryFormState = {
  id?: string
  name: string
  icon: string
  order: number
  active: boolean
}

export type PromotionFormState = {
  id?: string
  title: string
  description: string
  image: string
  discount: number
  validFrom: string
  validTo: string
  productIds: string[]
  categoryIds: string[]
  active: boolean
}

export type TableFormState = {
  id?: string
  number: number
  capacity: number
  status: TableStatus
  active: boolean
}

export type UserFormState = {
  id?: string
  name: string
  email: string
  role: User['role']
  staffRole: User['staffRole']
  phone: string
  pin: string
  avatar: string
  active: boolean
  password: string
}

export const emptyProductForm = (): ProductFormState => ({
  name: '',
  description: '',
  price: 0,
  image: '',
  categoryId: '',
  featured: false,
  available: true,
  preparationTime: 0,
  trackStock: false,
  stock: 0,
  lowStockThreshold: 5,
  options: [],
})

export const emptyCategoryForm = (): CategoryFormState => ({
  name: '',
  icon: 'coffee',
  order: 0,
  active: true,
})

export const emptyPromotionForm = (): PromotionFormState => ({
  title: '',
  description: '',
  image: '',
  discount: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date().toISOString().slice(0, 10),
  productIds: [],
  categoryIds: [],
  active: true,
})

export const emptyTableForm = (): TableFormState => ({
  number: 1,
  capacity: 2,
  status: 'free',
  active: true,
})

export const emptyUserForm = (): UserFormState => ({
  name: '',
  email: '',
  role: 'staff',
  staffRole: 'runner',
  phone: '',
  pin: '',
  avatar: '',
  active: true,
  password: '',
})
