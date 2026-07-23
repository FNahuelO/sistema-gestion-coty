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
  trackStock?: boolean
  stock?: number
  lowStockThreshold?: number
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
  unitPrice?: number
  selectionLines?: Array<{ optionName: string; choiceName: string; priceModifier: number }>
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
  dailyNumber?: number
  type: OrderType
  status: OrderStatus
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  tip?: number
  discountCode?: string
  discountAmount?: number
  total: number
  estimatedMinutes?: number
  estimatedReadyAt?: Date
  paymentMethod: PaymentMethod
  paymentStatus?: PaymentStatus
  paymentUrl?: string
  whatsappCheckoutUrl?: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  tableId?: string
  tableNumber?: number
  tableSessionId?: string
  createdByUserId?: string
  notes?: string
  deliveryZoneName?: string
  createdAt: Date
  updatedAt: Date
  offlinePending?: boolean
  trackingProof?: string
}

export type DeliveryAssignmentStatus = 'unassigned' | 'assigned' | 'picked_up' | 'delivered'

export interface DeliveryQueueEntry {
  orderId: string
  assignmentStatus: DeliveryAssignmentStatus
  orderStatus: OrderStatus
  runner?: { id: string; name: string } | null
  order: {
    displayCode?: string | null
    dailyNumber?: number | null
    customerName: string
    customerPhone?: string | null
    customerAddress?: string | null
    total: number
    deliveryFee?: number
    createdAt: string
  }
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
export type UserRole = 'admin' | 'staff' | 'customer'
export type StaffRole = 'cashier' | 'waitress' | 'runner' | 'kitchen'

export function isStaffRole(role?: string | null): role is 'staff' {
  return role === 'staff' || role === 'cashier' || role === 'waitress'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  staffRole?: StaffRole | null
  phone?: string
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
  imageUrl?: string
}

export interface HourlySales {
  hour: number
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
  tablesServedToday: number
  salesByType: SalesByType
  salesByTypeToday: SalesByType
  hourlySalesToday: HourlySales[]
  topProducts: ProductSales[]
  topProductsByRevenue: ProductSales[]
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
  timezone?: string
  phone: string
  address: string
  instagram?: string
  facebook?: string
  whatsapp: string
  transferAlias?: string
  transferCbu?: string
  deliveryFee: number
  minOrderAmount: number
  taxRate: number
  mercadoPagoEnabled?: boolean
}

export interface ChannelSchedule {
  id: string
  channel: 'delivery' | 'local' | 'pickup'
  label: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  active: boolean
  sortOrder: number
}

export interface ChannelSetting {
  channel: 'delivery' | 'local' | 'pickup'
  enabled: boolean
}
