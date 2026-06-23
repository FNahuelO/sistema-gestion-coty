'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react'
import type { AnalyticsOverview, BusinessSettings, CartItem, Category, ChannelSchedule, ChannelSetting, Order, OrderStatus, Product, Promotion, SelectedOption, Table, User } from '@/lib/types'
import { getOfflineCache, isBrowserOffline, OFFLINE_CACHE_KEYS, setOfflineCache } from '@/lib/offline-cache'
import {
  enqueueOfflineOrder,
  getPendingOfflineOrders,
  OFFLINE_QUEUE_CHANGED_EVENT,
  queuedEntryToOrder,
  type CreateOrderPayload,
} from '@/lib/offline-order-queue'
import { getMesaIdFromSearch } from '@/lib/menu-url'
import { hasPermission, type Permission, type SessionRoleContext } from '@/lib/permissions'

const CART_STORAGE_KEY = 'coty-cafe-cart'

export function clearStoredCart() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CART_STORAGE_KEY)
}
const TRACKING_CODES_KEY = 'coty-cafe-tracking-codes'
const TABLE_SESSION_STORAGE_KEY = 'coty-cafe-table-session'

type TableSession = {
  tableId: string
  tableNumber: number
}

type CreateOrderItemInput = CreateOrderPayload['items'][number]

type AdminUserInput = {
  name: string
  email: string
  role: User['role']
  staffRole?: User['staffRole'] | null
  phone?: string
  pin?: string
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
  schedules: ChannelSchedule[]
  channelSettings: ChannelSetting[]
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
  restoreTable: (id: string) => Promise<Table>
  createTableOrder: (tableId: string, items: Array<{ productId: string; quantity: number; selectedOptions: SelectedOption[]; notes?: string }>) => Promise<void>
  addUser: (payload: AdminUserInput) => Promise<User>
  updateUser: (id: string, payload: AdminUserInput) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  updateSettings: (payload: BusinessSettings) => Promise<BusinessSettings>
  saveSchedule: (payload: Omit<ChannelSchedule, 'id'> & { id?: string }) => Promise<ChannelSchedule>
  deleteSchedule: (id: string) => Promise<void>
  updateChannelSetting: (channel: ChannelSetting['channel'], enabled: boolean) => Promise<ChannelSetting>
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

const fetchJsonWithOfflineCache = async <T,>(url: string, cacheKey: string): Promise<T> => {
  try {
    const data = await fetchJson<T>(url)
    setOfflineCache(cacheKey, data)
    return data
  } catch (error) {
    const cached = getOfflineCache<T>(cacheKey)
    if (cached) return cached
    throw error
  }
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

export function rememberOrderTracking(...values: Array<string | undefined>) {
  for (const value of values) {
    storeTrackingCode(value)
  }
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
  if (isBrowserOffline()) {
    throw new Error('Sin conexión a internet. Volvé a intentar cuando tengas señal.')
  }

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

type TableSessionContextType = {
  tableSession: TableSession | null
  hydrated: boolean
  isLoading: boolean
  error: string | null
  isTableMode: boolean
  resolveTable: (tableId: string) => Promise<TableSession>
  clearTableSession: () => void
}

const TableSessionContext = createContext<TableSessionContextType | null>(null)

export function TablesProvider({ children }: { children: ReactNode }) {
  const [tableSession, setTableSession] = useState<TableSession | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Sesiones guardadas en localStorage (versión anterior) podían quedar fijadas a una mesa.
      window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY)

      const mesaFromUrl = getMesaIdFromSearch(window.location.search)
      const path = window.location.pathname

      if (path === '/' && !mesaFromUrl) {
        window.sessionStorage.removeItem(TABLE_SESSION_STORAGE_KEY)
        setTableSession(null)
        return
      }

      if (mesaFromUrl) {
        return
      }

      const stored = window.sessionStorage.getItem(TABLE_SESSION_STORAGE_KEY)
      if (stored) {
        setTableSession(JSON.parse(stored) as TableSession)
      }
    } catch {
      setTableSession(null)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (tableSession) {
      window.sessionStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(tableSession))
    } else {
      window.sessionStorage.removeItem(TABLE_SESSION_STORAGE_KEY)
    }
  }, [tableSession, hydrated])

  const resolveTable = useCallback(async (tableId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tables/${tableId}`)
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Mesa no encontrada')
      }

      const session = {
        tableId: payload.id as string,
        tableNumber: payload.number as number,
      }

      setTableSession(session)
      return session
    } catch (resolveError) {
      setTableSession(null)
      setError(resolveError instanceof Error ? resolveError.message : 'Mesa no encontrada')
      throw resolveError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearTableSession = useCallback(() => {
    setTableSession(null)
    setError(null)
  }, [])

  const value = useMemo<TableSessionContextType>(
    () => ({
      tableSession,
      hydrated,
      isLoading,
      error,
      isTableMode: Boolean(tableSession),
      resolveTable,
      clearTableSession,
    }),
    [tableSession, hydrated, isLoading, error, resolveTable, clearTableSession]
  )

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>
}

export function useTableSession() {
  const context = useContext(TableSessionContext)
  if (!context) {
    throw new Error('useTableSession must be used within a TablesProvider')
  }
  return context
}

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
    clearStoredCart()
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
      staffRole: data.user.staffRole ?? undefined,
      avatar: data.user.avatar ?? undefined,
    }
  }, [data])

  const loginWithCredentials = useCallback(async (credentials: Record<string, string>) => {
    const result = await signIn('credentials', {
      ...credentials,
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
      staffRole: session.user.staffRole ?? undefined,
      avatar: session.user.avatar ?? undefined,
    } satisfies User
  }, [])

  const login = useCallback(
    async (email: string, password: string) =>
      loginWithCredentials({
        loginMode: 'password',
        email,
        password,
      }),
    [loginWithCredentials]
  )

  const loginWithPin = useCallback(
    async (pin: string) =>
      loginWithCredentials({
        loginMode: 'pin',
        pin,
      }),
    [loginWithCredentials]
  )

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
  }, [])

  return {
    user,
    login,
    loginWithPin,
    logout,
    isLoading: status === 'loading',
  }
}

export function useBusiness() {
  const { data, error, isLoading, mutate } = useSWR<BusinessSettings>(
    '/api/settings',
    () => fetchJsonWithOfflineCache<BusinessSettings>('/api/settings', OFFLINE_CACHE_KEYS.settings),
    {
      revalidateOnFocus: false,
      fallbackData: typeof window !== 'undefined' ? getOfflineCache<BusinessSettings>(OFFLINE_CACHE_KEYS.settings) ?? undefined : undefined,
    }
  )

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
    isOfflineCache: isBrowserOffline() && Boolean(getOfflineCache(OFFLINE_CACHE_KEYS.settings)),
    refresh: mutate,
  }
}

export function useCatalog() {
  type CatalogData = {
    settings: BusinessSettings | null
    categories: Category[]
    products: Product[]
    promotions: Array<Promotion & { validFrom: string | Date; validTo: string | Date }>
    channelAvailability?: Record<'delivery' | 'local' | 'pickup', { open: boolean; reason?: string }> | null
    deliveryZones?: Array<{ id: string; name: string; deliveryFee: number; minOrderAmount: number }>
    mercadoPagoAvailable?: boolean
  }

  const { data, error, isLoading, mutate } = useSWR<CatalogData>(
    '/api/catalog',
    () => fetchJsonWithOfflineCache<CatalogData>('/api/catalog', OFFLINE_CACHE_KEYS.catalog),
    {
      revalidateOnFocus: false,
      fallbackData: typeof window !== 'undefined' ? getOfflineCache<CatalogData>(OFFLINE_CACHE_KEYS.catalog) ?? undefined : undefined,
    }
  )

  return {
    settings: data?.settings ?? null,
    categories: data?.categories ?? [],
    products: data?.products ?? [],
    promotions: (data?.promotions ?? []).map(parsePromotion),
    channelAvailability: data?.channelAvailability ?? null,
    deliveryZones: data?.deliveryZones ?? [],
    mercadoPagoAvailable: data?.mercadoPagoAvailable ?? false,
    error,
    isLoading,
    isOfflineCache: isBrowserOffline() && Boolean(getOfflineCache(OFFLINE_CACHE_KEYS.catalog)),
    refresh: mutate,
  }
}

export function useOrders() {
  const { user } = useAuth()
  const shouldFetch = Boolean(user?.role)
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([])
  const { data, error, isLoading, mutate } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    shouldFetch ? '/api/orders' : null,
    fetchJson,
    {
      refreshInterval: shouldFetch ? 5000 : 0,
      revalidateOnFocus: true,
    }
  )

  const refreshOfflineOrders = useCallback(() => {
    setOfflineOrders(getPendingOfflineOrders().map(queuedEntryToOrder))
  }, [])

  useEffect(() => {
    refreshOfflineOrders()
    const refresh = () => {
      refreshOfflineOrders()
      void mutate()
    }
    window.addEventListener('coty-refresh-orders', refresh)
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener('coty-refresh-orders', refresh)
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh)
    }
  }, [mutate, refreshOfflineOrders])

  const serverOrders = useMemo(() => (data ?? []).map(parseOrder), [data])

  const orders = useMemo(() => {
    const pendingIds = new Set(offlineOrders.map((order) => order.id))
    return [...offlineOrders, ...serverOrders.filter((order) => !pendingIds.has(order.id))]
  }, [offlineOrders, serverOrders])

  const addOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      if (payload.paymentMethod === 'mercado_pago' && isBrowserOffline()) {
        throw new Error('Mercado Pago requiere conexión a internet.')
      }

      if (isBrowserOffline()) {
        const entry = enqueueOfflineOrder({ kind: 'customer', payload })
        const order = queuedEntryToOrder(entry)
        storeTrackingCode(order.publicTrackingCode ?? order.id)
        return order
      }

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
    orders,
    addOrder,
    updateOrderStatus,
    closeOrder,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useTrackedOrders(searchId: string, paymentReturnOrderId?: string | null) {
  const [codes, setCodes] = useState<string[]>([])
  const [codesBootstrapped, setCodesBootstrapped] = useState(false)
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([])

  useEffect(() => {
    setCodes(getStoredTrackingCodes())
    setCodesBootstrapped(true)
  }, [])

  useEffect(() => {
    if (!paymentReturnOrderId) return
    storeTrackingCode(paymentReturnOrderId)
    setCodes(getStoredTrackingCodes())
  }, [paymentReturnOrderId])

  useEffect(() => {
    const refresh = () => {
      setOfflineOrders(
        getPendingOfflineOrders()
          .filter((entry) => entry.kind === 'customer')
          .map(queuedEntryToOrder)
      )
    }
    refresh()
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh)
  }, [])

  const trackingCodes = useMemo(() => {
    const merged = new Set(codes)
    if (paymentReturnOrderId) merged.add(paymentReturnOrderId)
    return [...merged]
  }, [codes, paymentReturnOrderId])

  const queryString = useMemo(() => {
    if (searchId.trim()) {
      return `/api/orders/track?query=${encodeURIComponent(searchId.trim())}`
    }
    if (trackingCodes.length > 0) {
      return `/api/orders/track?codes=${encodeURIComponent(trackingCodes.join(','))}`
    }
    if (paymentReturnOrderId) {
      return `/api/orders/track?query=${encodeURIComponent(paymentReturnOrderId)}`
    }
    return null
  }, [trackingCodes, searchId, paymentReturnOrderId])

  const { data, error, isLoading, mutate } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    queryString,
    fetchJson,
    {
      refreshInterval: queryString ? 10000 : 0,
      revalidateOnFocus: true,
    }
  )

  const serverOrders = useMemo(() => (data ?? []).map(parseOrder), [data])

  useEffect(() => {
    if (!serverOrders.length) return
    for (const order of serverOrders) {
      storeTrackingCode(order.publicTrackingCode ?? order.id)
      if (order.displayCode) storeTrackingCode(order.displayCode)
    }
    setCodes(getStoredTrackingCodes())
  }, [serverOrders])

  const orders = useMemo(() => {
    const query = searchId.trim().toLowerCase()
    const offlineMatches = offlineOrders.filter((order) => {
      if (!query) {
        return trackingCodes.some(
          (code) =>
            code === order.id ||
            code === order.publicTrackingCode ||
            code === order.displayCode
        )
      }
      return (
        order.id.toLowerCase().includes(query) ||
        order.displayCode?.toLowerCase().includes(query) ||
        order.publicTrackingCode?.toLowerCase().includes(query)
      )
    })
    const offlineIds = new Set(offlineMatches.map((order) => order.id))
    return [...offlineMatches, ...serverOrders.filter((order) => !offlineIds.has(order.id))]
  }, [serverOrders, offlineOrders, trackingCodes, searchId])

  return {
    orders,
    error,
    isLoading:
      !codesBootstrapped ||
      (Boolean(queryString) && data === undefined && !error) ||
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
    async (tableId: string, paymentMethod: 'cash' | 'card' | 'transfer' = 'cash') => {
      const table = await sendJson<Table>(`/api/tables/${tableId}/close`, 'POST', { paymentMethod })
      await mutate()
      return table
    },
    [mutate]
  )

  const createTableOrder = useCallback(
    async (tableId: string, payload: { items: CreateOrderItemInput[]; notes?: string }, tableNumber?: number) => {
      const orderPayload: CreateOrderPayload = {
        type: 'table',
        paymentMethod: 'cash',
        customerName: tableNumber ? `Mesa ${tableNumber}` : 'Mesa',
        customerPhone: '',
        tableId,
        notes: payload.notes,
        items: payload.items,
      }

      if (isBrowserOffline()) {
        const entry = enqueueOfflineOrder({
          kind: 'table',
          tableId,
          tableNumber,
          payload: orderPayload,
        })
        return queuedEntryToOrder(entry)
      }

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
  const { user } = useAuth()
  const roleContext = useMemo<SessionRoleContext>(
    () => ({
      role: user?.role === 'admin' ? 'admin' : 'staff',
      staffRole: user?.staffRole ?? null,
    }),
    [user]
  )
  const can = useCallback((permission: Permission) => hasPermission(roleContext, permission), [roleContext])

  const { data: usersData, mutate: mutateUsers } = useSWR<User[]>(can('staff:manage') ? '/api/admin/users' : null, fetchJson)
  const { data: productsData, mutate: mutateProducts } = useSWR<Product[]>(can('settings:write') ? '/api/admin/products' : null, fetchJson)
  const { data: catalogData, mutate: mutateCatalog } = useSWR<{ products: Product[] }>(
    can('tables:manage') && !can('settings:write') ? '/api/catalog' : null,
    fetchJson
  )
  const { data: categoriesData, mutate: mutateCategories } = useSWR<Category[]>(can('settings:write') ? '/api/admin/categories' : null, fetchJson)
  const { data: promotionsData, mutate: mutatePromotions } = useSWR<Array<Promotion & { validFrom: string | Date; validTo: string | Date }>>(
    can('settings:write') ? '/api/admin/promotions' : null,
    fetchJson
  )
  const { data: settingsData, mutate: mutateSettings } = useSWR<BusinessSettings>(
    can('settings:read') ? '/api/admin/settings' : null,
    fetchJson
  )
  const { data: schedulesData, mutate: mutateSchedules } = useSWR<{ schedules: ChannelSchedule[]; channelSettings: ChannelSetting[] }>(
    can('schedules:manage') ? '/api/admin/schedules' : null,
    fetchJson
  )
  const { data: tablesData, mutate: mutateTables } = useSWR<Table[]>(can('tables:manage') ? '/api/tables' : null, fetchJson)
  const { data: ordersData, mutate: mutateOrders } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    can('staff:operate') ? '/api/orders' : null,
    fetchJson
  )
  const { data: analyticsData, mutate: mutateAnalytics } = useSWR<AnalyticsOverview>(
    can('analytics:read') ? '/api/admin/analytics' : null,
    fetchJson,
    {
      refreshInterval: can('analytics:read') ? 15000 : 0,
      revalidateOnFocus: true,
    }
  )
  const { data: historyData, mutate: mutateHistory } = useSWR<Array<Order & { createdAt: string | Date; updatedAt: string | Date }>>(
    can('analytics:read') ? '/api/admin/orders/history' : null,
    fetchJson
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([
      can('settings:write') ? mutateProducts() : Promise.resolve(),
      can('tables:manage') && !can('settings:write') ? mutateCatalog() : Promise.resolve(),
      can('staff:manage') ? mutateUsers() : Promise.resolve(),
      can('settings:write') ? mutateCategories() : Promise.resolve(),
      can('settings:write') ? mutatePromotions() : Promise.resolve(),
      can('settings:read') ? mutateSettings() : Promise.resolve(),
      can('schedules:manage') ? mutateSchedules() : Promise.resolve(),
      can('tables:manage') ? mutateTables() : Promise.resolve(),
      can('staff:operate') ? mutateOrders() : Promise.resolve(),
      can('analytics:read') ? mutateAnalytics() : Promise.resolve(),
      can('analytics:read') ? mutateHistory() : Promise.resolve(),
    ])
  }, [
    can,
    mutateAnalytics,
    mutateCategories,
    mutateHistory,
    mutateOrders,
    mutateCatalog,
    mutateProducts,
    mutatePromotions,
    mutateSchedules,
    mutateSettings,
    mutateTables,
    mutateUsers,
  ])

  return {
    users: usersData ?? [],
    products: can('settings:write') ? (productsData ?? []) : (catalogData?.products ?? []),
    categories: categoriesData ?? [],
    promotions: (promotionsData ?? []).map(parsePromotion),
    tables: tablesData ?? [],
    orders: (ordersData ?? []).map(parseOrder),
    settings: settingsData ?? null,
    schedules: schedulesData?.schedules ?? [],
    channelSettings: schedulesData?.channelSettings ?? [],
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
    restoreTable: async (id) => {
      const table = await sendJson<Table>(`/api/tables/${id}`, 'PATCH', { restore: true })
      await mutateTables()
      return table
    },
    createTableOrder: async (tableId, items) => {
      await sendJson(`/api/tables/${tableId}/orders`, 'POST', { items })
      await Promise.all([mutateTables(), mutateOrders()])
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
    saveSchedule: async (payload) => {
      const schedule = await sendJson<ChannelSchedule>('/api/admin/schedules', 'POST', payload)
      await mutateSchedules()
      return schedule
    },
    deleteSchedule: async (id) => {
      await sendJson('/api/admin/schedules', 'DELETE', { id })
      await mutateSchedules()
    },
    updateChannelSetting: async (channel, enabled) => {
      const setting = await sendJson<ChannelSetting>('/api/admin/channel-settings', 'PATCH', { channel, enabled })
      await mutateSchedules()
      return setting
    },
    exportSalesUrl: (format = 'xlsx') => `/api/admin/exports/sales?format=${format}`,
    refreshAll,
  }
}

export function useStore() {
  return useAdminData()
}
