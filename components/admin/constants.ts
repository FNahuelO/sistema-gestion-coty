import type { ElementType } from 'react'
import {
  BarChart3,
  Clock,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  Store,
  Truck,
  Users,
  Wallet,
  Briefcase,
} from 'lucide-react'
import type { OrderType } from '@/lib/types'
import type { AdminSection, FormSection } from './types'

export const NAV_ITEMS: { id: AdminSection; label: string; icon: ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'categories', label: 'Categorías', icon: LayoutGrid },
  { id: 'promotions', label: 'Promociones', icon: Percent },
  { id: 'tables', label: 'Mesas', icon: Store },
  { id: 'users', label: 'Personal', icon: Users },
  { id: 'schedules', label: 'Turnos', icon: Clock },
  { id: 'cash', label: 'Caja', icon: Wallet },
  { id: 'commerce', label: 'Comercio', icon: Briefcase },
  { id: 'settings', label: 'Configuración', icon: Settings },
]

export const DEFAULT_FORM_PANELS: Record<FormSection, boolean> = {
  products: false,
  categories: false,
  promotions: false,
  tables: false,
  users: false,
  schedules: false,
  cash: false,
  commerce: false,
  settings: false,
}

export const ORDER_TYPE_META: Record<OrderType, { label: string; accent: string; icon: ElementType }> = {
  delivery: { label: 'Delivery', accent: 'border-l-[#E8A598]', icon: Truck },
  pickup: { label: 'Retiro', accent: 'border-l-[#7EB8B3]', icon: Store },
  table: { label: 'Mesa', accent: 'border-l-[#7EB8B3]', icon: Users },
}

export const HISTORY_PAGE_SIZE = 15
