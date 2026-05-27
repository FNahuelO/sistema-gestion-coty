// Product types
export interface Product {
  id: string
  slug?: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  featured: boolean
  available: boolean
  preparationTime: number // minutes
  options?: ProductOption[]
}

export interface ProductOption {
  id: string
  name: string
  choices: ProductChoice[]
  required: boolean
  multiple: boolean
}

export interface ProductChoice {
  id: string
  name: string
  priceModifier: number
}

export interface Category {
  id: string
  slug?: string
  name: string
  icon: string
  order: number
  active?: boolean
}

// Cart types
export interface CartItem {
  id: string
  product: Product
  quantity: number
  selectedOptions: SelectedOption[]
  notes?: string
}

export interface SelectedOption {
  optionId: string
  choiceIds: string[]
}

// Order types
export type OrderType = 'delivery' | 'pickup' | 'table'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mercado_pago'
export type PaymentStatus = 'pending' | 'requires_action' | 'approved' | 'rejected' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  displayCode?: string
  publicTrackingCode?: string
  type: OrderType
  status: OrderStatus
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus?: PaymentStatus
  paymentUrl?: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  tableId?: string
  tableNumber?: number
  tableSessionId?: string
  createdByUserId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Table types
export type TableStatus = 'free' | 'occupied' | 'waiting' | 'finished'

export interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
  active?: boolean
  currentOrderId?: string
  waitressId?: string
  currentTotal?: number
  currentSessionId?: string
}

// User types
export type UserRole = 'admin' | 'cashier' | 'waitress' | 'customer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  active?: boolean
}

// Promotion types
export interface Promotion {
  id: string
  title: string
  description: string
  image: string
  discount: number // percentage
  validFrom: Date
  validTo: Date
  productIds?: string[]
  categoryIds?: string[]
  active: boolean
}

// Analytics types
export interface DailySales {
  date: string
  revenue: number
  orders: number
}

export interface ProductSales {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface SalesByType {
  delivery: number
  pickup: number
  table: number
}

export interface AnalyticsOverview {
  todayRevenue: number
  todayOrders: number
  averageTicket: number
  totalRevenue: number
  activeOrders: number
  tablesServed: number
  salesByType: SalesByType
  topProducts: ProductSales[]
  dailySales: DailySales[]
}

// Business settings
export interface BusinessSettings {
  id?: string
  name: string
  logo: string
  isOpen: boolean
  openTime: string
  closeTime: string
  phone: string
  address: string
  instagram?: string
  facebook?: string
  whatsapp: string
  deliveryFee: number
  minOrderAmount: number
  taxRate: number
}
