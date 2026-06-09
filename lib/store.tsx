'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react'
import type { AnalyticsOverview, BusinessSettings, CartItem, Category, Order, OrderStatus, PaymentMethod, Product, Promotion, SelectedOption, Table, User } from '@/lib/types'

const CART_STORAGE_KEY = 'coty-cafe-cart'
const TRACKING_CODES_KEY = 'coty-cafe-tracking-codes'

type CreateOrderItemInput = {
  productId: string
  quantity: number
  selectedOptions: SelectedOption[]
  notes?: string
}

type CreateOrderPayload = {
  type: Order['type']
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerAddress?: string
  notes?: string
  tableId?: string
  items: CreateOrderItemInput[]
}

type AdminUserInput = {
  name: string
  email: string
  role: User['role']
  avatar?: string
  active: boolean
  password?: string
}

type AdminData = {
  users: User[]
  products: Product[]
  categories: Category[]
  promotions: Promotion[]
  tables: Table[]
  orders: Order[]
  settings: BusinessSettings | null
  analytics: AnalyticsOverview | null
  history: Order[]
  addProduct: (payload: Omit<Product, 'id'>) => Promise<Product>
  updateProduct: (id: string, payload: Omit<Product, 'id'>) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  addCategory: (payload: Omit<Category, 'id'>) => Promise<Category>
  updateCategory: (id: string, payload: Omit<Category, 'id'>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  addPromotion: (payload: Omit<Promotion, 'id'>) => Promise<Promotion>
  updatePromotion: (id: string, payload: Omit<Promotion, 'id'>) => Promise<Promotion>
  deletePromotion: (id: string) => Promise<void>
  addTable: (payload: Omit<Table, 'id'>) => Promise<Table>
  updateTable: (id: string, payload: Partial<Omit<Table, 'id'>>) => Promise<Table>
  deleteTable: (id: string) => Promise<void>
  addUser: (payload: AdminUserInput) => Promise<User>
  updateUser: (id: string, payload: AdminUserInput) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  updateSettings: (payload: BusinessSettings) => Promise<BusinessSettings>
  exportSalesUrl: (format?: 'xlsx' | 'csv') => string
  refreshAll: () => Promise<void>
}

const noopProvider = ({ children }: { children: ReactNode }) => children

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error ?? 'Error de red')
  }

  return response.json()
}

const parsePromotion = (promotion: Promotion & { validFrom: string | Date; validTo: string | Date }): Promotion => ({
  ...promotion,
  validFrom: new Date(promotion.validFrom),
  validTo: new Date(promotion.validTo),
})

const parseOrder = (order: Order & { createdAt: string | Date; updatedAt: string | Date }): Order => ({
  ...order,
  createdAt: new Date(order.createdAt),
  updatedAt: new Date(order.updatedAt),
})

const storeTrackingCode = (value?: string) => {
  if (typeof window === 'undefined' || !value) return
  const current = new Set<string>(JSON.parse(window.localStorage.getItem(TRACKING_CODES_KEY) ?? '[]'))
  current.add(value)
  window.localStorage.setItem(TRACKING_CODES_KEY, JSON.stringify([...current]))
}

const getStoredTrackingCodes = () => {
  if (typeof window === 'undefined') return [] as string[]
  try {
    return JSON.parse(window.localStorage.getItem(TRACKING_CODES_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error ?? 'No se pudo completar la operación')
  }

  return response.json()
}

interface CartContextType {
  items: CartItem[]
  hydrated: boolean
  addItem: (product: Product, quantity: number, selectedOptions: SelectedOption[], notes?: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

export const BusinessProvider = noopProvider
export const OrdersProvider = noopProvider
export const TablesProvider = noopProvider

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      setItems([])
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((product: Product, quantity: number, selectedOptions: SelectedOption[], notes?: string) => {
    setItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions) &&
          item.notes === notes
      )

      if (existingIndex >= 0) {
        const updated = [...previous]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      return [
        ...previous,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          product,
          quantity,
          selectedOptions,
          notes,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((previous) => previous.filter((item) => item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((previous) =>
      previous
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const modifiers = item.selectedOptions.reduce((modSum, selectedOption) => {
          const option = item.product.options?.find((candidate) => candidate.id === selectedOption.optionId)
          return (
            modSum +
            (option?.choices
              .filter((choice) => selectedOption.choiceIds.includes(choice.id))
              .reduce((choiceSum, choice) => choiceSum + choice.priceModifier, 0) ?? 0)
          )
        }, 0)

        return sum + (item.product.price + modifiers) * item.quantity
      }, 0),
    [items]
  )

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, hydrated, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function useAuth() {
  const { data, status } = useSession()

  const user = useMemo<User | null>(() => {
    if (!data?.user) return null
    return {
      id: data.user.id,
      name: data.user.name ?? '',
      email: data.user.email ?? '',
      role: data.user.role,
      avatar: data.user.avatar ?? undefined,
    }
  }, [data])

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) return null

    const sessionResponse = await fetch('/api/auth/session')
    const session = await sessionResponse.json()

    if (!session?.user) return null

    return {
      id: session.user.id,
      name: session.user.name ?? '',
      email: session.user.email ?? '',
      role: session.user.role,
      avatar: session.user.avatar ?? undefined,
    } satisfies User
  }, [])

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
  }, [])

  return {
    user,
    login,
    logout,
    isLoading: status === 'loading',
  }
}

export function useBusiness() {
  const { data, error, isLoading, mutate } = useSWR<BusinessSettings>('/api/settings', fetchJson, {
    revalidateOnFocus: false,
  })

  return {
    settings:
      data ?? {
        name: 'Coty Café',
        logo: '/logo.png',
        isOpen: false,
        openTime: '07:00',
        closeTime: '21:00',
        phone: '',
        address: '',
        whatsapp: '',
        deliveryFee: 0,
        minOrderAmount: 0,
        taxRate: 0,
      },
    error,
    isLoading,
    refresh: mutate,
  }
}

export function useCatalog() {
  const { data, error, isLoading, mutate } = useSWR<{
    settings: BusinessSettings | null
    categories: Category[]
    products: Product[]
    promotions: Array<Promotion & { validFrom: string | Date; validTo: string | Date }>
  }>('/api/catalog', fetchJson, {
    revalidateOnFocus: false,
  })

  return {
    settings: data?.settings ?? null,
    categories: data?.categories ?? [],
    products: data?.products ?? [],
    promotions: (data?.promotions ?? []).map(parsePromotion),
    error,
    isLoading,
    refresh: mutate,
  }
}

export function useOrders() {
  const { user } = useAuth()
  const shouldFetch = Boolean(user?.role)
  const { data, error, isLoading, mutate } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    shouldFetch ? '/api/orders' : null,
    fetchJson,
    {
      refreshInterval: shouldFetch ? 5000 : 0,
      revalidateOnFocus: true,
    }
  )

  const addOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      const order = parseOrder(await sendJson<Order & { createdAt: string; updatedAt: string }>('/api/orders', 'POST', payload))
      storeTrackingCode(order.publicTrackingCode ?? order.id)
      await mutate()
      return order
    },
    [mutate]
  )

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, note?: string) => {
      const order = parseOrder(
        await sendJson<Order & { createdAt: string; updatedAt: string }>(`/api/cashier/orders/${orderId}/status`, 'PATCH', {
          status,
          note,
        })
      )
      await mutate()
      return order
    },
    [mutate]
  )

  const closeOrder = useCallback(
    async (orderId: string) => {
      const order = parseOrder(
        await sendJson<Order & { createdAt: string; updatedAt: string }>(`/api/cashier/orders/${orderId}/close`, 'POST')
      )
      await mutate()
      return order
    },
    [mutate]
  )

  return {
    orders: (data ?? []).map(parseOrder),
    addOrder,
    updateOrderStatus,
    closeOrder,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useTrackedOrders(searchId: string) {
  const [codes, setCodes] = useState<string[]>([])

  useEffect(() => {
    setCodes(getStoredTrackingCodes())
  }, [])

  const queryString = useMemo(() => {
    if (searchId.trim()) {
      return `/api/orders/track?query=${encodeURIComponent(searchId.trim())}`
    }
    if (codes.length > 0) {
      return `/api/orders/track?codes=${encodeURIComponent(codes.join(','))}`
    }
    return null
  }, [codes, searchId])

  const { data, error, isLoading, mutate } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    queryString,
    fetchJson,
    {
      refreshInterval: queryString ? 10000 : 0,
      revalidateOnFocus: true,
    }
  )

  return {
    orders: (data ?? []).map(parseOrder),
    error,
    isLoading,
    refresh: mutate,
    rememberTrackingCode: (value: string) => {
      storeTrackingCode(value)
      setCodes(getStoredTrackingCodes())
    },
  }
}

export function useTables() {
  const { user } = useAuth()
  const shouldFetch = Boolean(user?.role)
  const { data, error, isLoading, mutate } = useSWR<Table[]>(shouldFetch ? '/api/tables' : null, fetchJson, {
    refreshInterval: shouldFetch ? 5000 : 0,
    revalidateOnFocus: true,
  })

  const updateTableStatus = useCallback(
    async (tableId: string, status: Table['status']) => {
      const table = await sendJson<Table>(`/api/tables/${tableId}`, 'PATCH', { status })
      await mutate()
      return table
    },
    [mutate]
  )

  const closeTable = useCallback(
    async (tableId: string) => {
      const table = await sendJson<Table>(`/api/tables/${tableId}/close`, 'POST')
      await mutate()
      return table
    },
    [mutate]
  )

  const createTableOrder = useCallback(
    async (tableId: string, payload: { items: CreateOrderItemInput[]; notes?: string }) => {
      const order = parseOrder(
        await sendJson<Order & { createdAt: string; updatedAt: string }>(`/api/tables/${tableId}/orders`, 'POST', payload)
      )
      await mutate()
      return order
    },
    [mutate]
  )

  const createTable = useCallback(
    async (payload: Omit<Table, 'id'>) => {
      const table = await sendJson<Table>('/api/tables', 'POST', payload)
      await mutate()
      return table
    },
    [mutate]
  )

  const updateTable = useCallback(
    async (id: string, payload: Partial<Omit<Table, 'id'>>) => {
      const table = await sendJson<Table>(`/api/tables/${id}`, 'PATCH', payload)
      await mutate()
      return table
    },
    [mutate]
  )

  const deleteTable = useCallback(
    async (id: string) => {
      await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await mutate()
    },
    [mutate]
  )

  return {
    tables: data ?? [],
    updateTableStatus,
    closeTable,
    createTableOrder,
    createTable,
    updateTable,
    deleteTable,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useAdminData(): AdminData {
  const { data: usersData, mutate: mutateUsers } = useSWR<User[]>('/api/admin/users', fetchJson)
  const { data: productsData, mutate: mutateProducts } = useSWR<Product[]>('/api/admin/products', fetchJson)
  const { data: categoriesData, mutate: mutateCategories } = useSWR<Category[]>('/api/admin/categories', fetchJson)
  const { data: promotionsData, mutate: mutatePromotions } = useSWR<Array<Promotion & { validFrom: string | Date; validTo: string | Date }>>(
    '/api/admin/promotions',
    fetchJson
  )
  const { data: settingsData, mutate: mutateSettings } = useSWR<BusinessSettings>('/api/admin/settings', fetchJson)
  const { data: tablesData, mutate: mutateTables } = useSWR<Table[]>('/api/tables', fetchJson)
  const { data: ordersData, mutate: mutateOrders } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    '/api/orders',
    fetchJson
  )
  const { data: analyticsData, mutate: mutateAnalytics } = useSWR<AnalyticsOverview>('/api/admin/analytics', fetchJson)
  const { data: historyData, mutate: mutateHistory } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    '/api/admin/orders/history',
    fetchJson
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([
      mutateProducts(),
      mutateUsers(),
      mutateCategories(),
      mutatePromotions(),
      mutateSettings(),
      mutateTables(),
      mutateOrders(),
      mutateAnalytics(),
      mutateHistory(),
    ])
  }, [mutateAnalytics, mutateCategories, mutateHistory, mutateOrders, mutateProducts, mutatePromotions, mutateSettings, mutateTables, mutateUsers])

  return {
    users: usersData ?? [],
    products: productsData ?? [],
    categories: categoriesData ?? [],
    promotions: (promotionsData ?? []).map(parsePromotion),
    tables: tablesData ?? [],
    orders: (ordersData ?? []).map(parseOrder),
    settings: settingsData ?? null,
    analytics: analyticsData ?? null,
    history: (historyData ?? []).map(parseOrder),
    addProduct: async (payload) => {
      const product = await sendJson<Product>('/api/admin/products', 'POST', payload)
      await mutateProducts()
      return product
    },
    updateProduct: async (id, payload) => {
      const product = await sendJson<Product>('/api/admin/products', 'PUT', { id, ...payload })
      await mutateProducts()
      return product
    },
    deleteProduct: async (id) => {
      await sendJson('/api/admin/products', 'DELETE', { id })
      await mutateProducts()
    },
    addCategory: async (payload) => {
      const category = await sendJson<Category>('/api/admin/categories', 'POST', payload)
      await mutateCategories()
      return category
    },
    updateCategory: async (id, payload) => {
      const category = await sendJson<Category>('/api/admin/categories', 'PUT', { id, ...payload })
      await mutateCategories()
      return category
    },
    deleteCategory: async (id) => {
      await sendJson('/api/admin/categories', 'DELETE', { id })
      await mutateCategories()
    },
    addPromotion: async (payload) => {
      const promotion = parsePromotion(await sendJson<Promotion & { validFrom: string; validTo: string }>('/api/admin/promotions', 'POST', payload))
      await mutatePromotions()
      return promotion
    },
    updatePromotion: async (id, payload) => {
      const promotion = parsePromotion(
        await sendJson<Promotion & { validFrom: string; validTo: string }>('/api/admin/promotions', 'PUT', { id, ...payload })
      )
      await mutatePromotions()
      return promotion
    },
    deletePromotion: async (id) => {
      await sendJson('/api/admin/promotions', 'DELETE', { id })
      await mutatePromotions()
    },
    addTable: async (payload) => {
      const table = await sendJson<Table>('/api/tables', 'POST', payload)
      await mutateTables()
      return table
    },
    updateTable: async (id, payload) => {
      const table = await sendJson<Table>(`/api/tables/${id}`, 'PATCH', payload)
      await mutateTables()
      return table
    },
    deleteTable: async (id) => {
      await fetch(`/api/tables/${id}`, { method: 'DELETE', credentials: 'include' })
      await mutateTables()
    },
    addUser: async (payload) => {
      const user = await sendJson<User>('/api/admin/users', 'POST', payload)
      await mutateUsers()
      return user
    },
    updateUser: async (id, payload) => {
      const user = await sendJson<User>('/api/admin/users', 'PUT', { id, ...payload })
      await mutateUsers()
      return user
    },
    deleteUser: async (id) => {
      await sendJson('/api/admin/users', 'DELETE', { id })
      await mutateUsers()
    },
    updateSettings: async (payload) => {
      const settings = await sendJson<BusinessSettings>('/api/admin/settings', 'PATCH', payload)
      await mutateSettings()
      return settings
    },
    exportSalesUrl: (format = 'xlsx') => `/api/admin/exports/sales?format=${format}`,
    refreshAll,
  }
}

export function useStore() {
  return useAdminData()
}
