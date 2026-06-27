'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Coffee,
  Users,
  X,
  Plus,
  Clock,
  CheckCircle,
  CreditCard,
  Minus,
  Search,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCatalog, useOrders, useTables } from '@/lib/store'
import { usePendingAction } from '@/hooks/use-pending-action'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ProductDetailModal } from '@/components/customer/product-detail-modal'
import type {
  Table,
  Product,
  CartItem,
  TableStatus,
  SelectedOption,
  PaymentMethod,
  Order,
  OrderStatus,
} from '@/lib/types'
import { toast } from 'sonner'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getDiscountedUnitPrice } from '@/lib/promotions'
import { PAYMENT_METHOD_LABELS } from '@/lib/order-labels'

type DisplayStatus = OrderStatus | TableStatus

const tableVisuals: Record<DisplayStatus, { color: string; icon: React.ElementType }> = {
  free: { color: 'bg-[#7EB8B3]', icon: CheckCircle },
  occupied: { color: 'bg-[#2D5A57]', icon: Coffee },
  waiting: { color: 'bg-[#EAB308]', icon: Clock },
  finished: { color: 'bg-[#053E38]', icon: CreditCard },
  pending: { color: 'bg-amber-500', icon: Clock },
  confirmed: { color: 'bg-sky-500', icon: CheckCircle },
  preparing: { color: 'bg-orange-500', icon: Coffee },
  ready: { color: 'bg-emerald-500', icon: CheckCircle },
  delivered: { color: 'bg-emerald-600', icon: CheckCircle },
  completed: { color: 'bg-gray-400', icon: CreditCard },
  cancelled: { color: 'bg-red-500', icon: X },
}

const STATUS_CHIP_ORDER: DisplayStatus[] = [
  'occupied',
  'waiting',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'finished',
]

const ORDER_PROGRESS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

function leastProgressedStatus(statuses: OrderStatus[]): OrderStatus {
  let result: OrderStatus = 'delivered'
  for (const status of statuses) {
    const index = ORDER_PROGRESS.indexOf(status)
    if (index !== -1 && index < ORDER_PROGRESS.indexOf(result)) {
      result = status
    }
  }
  return result
}

function resolveTableDisplayStatus(table: Table, tableOrders: Order[]): DisplayStatus {
  if (table.status === 'free' || table.status === 'finished') return table.status
  if (tableOrders.length === 0) return table.status
  return leastProgressedStatus(tableOrders.map((order) => order.status))
}

const CLOSE_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'mercado_pago']

function optionsKey(options: SelectedOption[], notes?: string) {
  return `${JSON.stringify(options)}|${notes ?? ''}`
}

export function TablesSection({ embedded = false }: { embedded?: boolean }) {
  const { tables, updateTableStatus, closeTable, createTableOrder } = useTables()
  const { orders } = useOrders()
  const { products, categories, promotions, settings } = useCatalog()
  const { isPending, isBusy, run } = usePendingAction()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [productPicker, setProductPicker] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('tables')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [closePaymentMethod, setClosePaymentMethod] = useState<PaymentMethod>('cash')
  const [sessionOrdersOpen, setSessionOrdersOpen] = useState(false)

  const taxRate = settings?.taxRate ?? 0.16

  const activeTableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.type === 'table' &&
          !['completed', 'cancelled'].includes(order.status)
      ),
    [orders]
  )

  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const order of activeTableOrders) {
      if (!order.tableId) continue
      const list = map.get(order.tableId) ?? []
      list.push(order)
      map.set(order.tableId, list)
    }
    return map
  }, [activeTableOrders])

  const statusCounts = useMemo(() => {
    const counts = new Map<DisplayStatus, number>()
    for (const table of tables) {
      const tableOrders = activeOrdersByTable.get(table.id) ?? []
      const status = resolveTableDisplayStatus(table, tableOrders)
      counts.set(status, (counts.get(status) ?? 0) + 1)
    }
    return counts
  }, [tables, activeOrdersByTable])

  const sessionOrders = useMemo(() => {
    if (!selectedTable) return []
    return orders.filter(
      (order) =>
        order.tableId === selectedTable.id &&
        !['completed', 'cancelled'].includes(order.status)
    )
  }, [orders, selectedTable])

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table)
    setOrderItems([])
    setAddProductOpen(false)
    setSearchQuery('')
  }

  const handleCloseTableDialog = () => {
    setSelectedTable(null)
    setAddProductOpen(false)
    setSearchQuery('')
  }

  const handleAddProductItem = (
    product: Product,
    quantity: number,
    selectedOptions: SelectedOption[],
    notes?: string
  ) => {
    const key = optionsKey(selectedOptions, notes)
    setOrderItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && optionsKey(item.selectedOptions, item.notes) === key
      )
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          product,
          quantity,
          selectedOptions,
          notes,
        },
      ]
    })
    toast.success(`${product.name} agregado`)
  }

  const handleProductClick = (product: Product) => {
    const hasOptions = Boolean(product.options?.length)
    if (hasOptions) {
      setProductPicker(product)
      return
    }
    handleAddProductItem(product, 1, [])
    setAddProductOpen(false)
  }

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const calculateNewItemsSubtotal = () =>
    orderItems.reduce(
      (sum, item) =>
        sum + getDiscountedUnitPrice(item.product, item.selectedOptions, promotions) * item.quantity,
      0
    )

  const handleOccupyTable = async (table: Table) => {
    await run(`occupy:${table.id}`, async () => {
      try {
        await updateTableStatus(table.id, 'occupied')
        toast.success(`Mesa ${table.number} ocupada`)
        setSelectedTable((current) => (current?.id === table.id ? { ...current, status: 'occupied' } : current))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo ocupar la mesa')
        throw error
      }
    })
  }

  const handleSendOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return

    await run(`send:${selectedTable.id}`, async () => {
      try {
        await createTableOrder(
          selectedTable.id,
          {
            items: orderItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions,
              notes: item.notes,
            })),
          },
          selectedTable.number
        )
        toast.success(
          navigator.onLine
            ? 'Pedido enviado a cocina'
            : 'Pedido guardado sin conexión. Se enviará al recuperar señal.'
        )
        setOrderItems([])
        setSelectedTable((current) =>
          current?.id === selectedTable.id ? { ...current, status: 'waiting' } : current
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo enviar el pedido')
        throw error
      }
    })
  }

  const handleMarkReadyToPay = async (table: Table) => {
    await run(`ready:${table.id}`, async () => {
      try {
        await updateTableStatus(table.id, 'finished')
        toast.success(`Mesa ${table.number} lista para cobrar`)
        setSelectedTable((current) => (current?.id === table.id ? { ...current, status: 'finished' } : current))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mesa')
        throw error
      }
    })
  }

  const handleConfirmClose = async () => {
    if (!selectedTable) return

    await run(`close:${selectedTable.id}`, async () => {
      try {
        await closeTable(selectedTable.id, closePaymentMethod)
        toast.success(`Mesa ${selectedTable.number} cobrada y cerrada`)
        setPaymentDialogOpen(false)
        setSelectedTable(null)
        setOrderItems([])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la mesa')
        throw error
      }
    })
  }

  const filteredProducts = products.filter(
    (p) =>
      p.available &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const newItemsSubtotal = calculateNewItemsSubtotal()
  const newItemsTax = newItemsSubtotal * taxRate
  const newItemsTotal = newItemsSubtotal + newItemsTax
  const accumulatedTotal = useMemo(
    () =>
      sessionOrders.reduce((sum, order) => sum + order.total, 0) || (selectedTable?.currentTotal ?? 0),
    [sessionOrders, selectedTable]
  )

  return (
    <div className={cn(!embedded && 'min-h-screen bg-[#FAFAFA] dark:bg-background')}>
      <div className={cn(embedded ? 'space-y-4' : 'w-full px-4 py-6 sm:px-6 lg:px-8')}>
        <div className={cn(PANEL_CARD, 'flex flex-wrap items-center gap-2 p-3')}>
          <Badge variant="outline" className="gap-1.5 border-[#C5DDD9] text-[#2D5A57]">
            <span className="h-2 w-2 rounded-full bg-[#7EB8B3]" />
            {tables.filter((t) => t.status === 'free').length} libres
          </Badge>
          {STATUS_CHIP_ORDER.filter((status) => (statusCounts.get(status) ?? 0) > 0).map((status) => {
            const visual = tableVisuals[status]
            const Icon = visual.icon
            return (
              <Badge key={status} variant="outline" className="gap-1.5 border-gray-200 dark:border-border">
                <span className={cn('h-2 w-2 rounded-full', visual.color)} />
                <Icon className="h-3 w-3 text-[#2D5A57]" />
                <StatusBadge status={status} className="border-0 bg-transparent p-0" />
                <span className="text-muted-foreground dark:text-white">({statusCounts.get(status)})</span>
              </Badge>
            )
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-auto w-full gap-1 bg-[#F8FBFA] p-1 dark:bg-muted">
            <TabsTrigger
              value="tables"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              Mapa de mesas
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              Pedidos activos
              {activeTableOrders.length > 0 && (
                <Badge variant="secondary" className="bg-[#C5DDD9]/60 text-[#2D5A57]">
                  {activeTableOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            {activeTableOrders.length === 0 ? (
              <div className={PANEL_CARD}>
                <EmptyState
                  icon="package"
                  title="Sin pedidos activos"
                  description="Los pedidos de mesa aparecerán aquí"
                />
              </div>
            ) : (
              activeTableOrders.map((order) => (
                <div key={order.id} className={cn(PANEL_LIST_ROW, 'border-l-4 border-l-[#2D5A57]')}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} productos · {order.displayCode ?? order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
                      >
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {tables.map((table, index) => {
                const tableOrders = activeOrdersByTable.get(table.id) ?? []
                const displayStatus = resolveTableDisplayStatus(table, tableOrders)
                const visual = tableVisuals[displayStatus]
                const StatusIcon = visual.icon

                return (
                  <motion.button
                    key={table.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectTable(table)}
                    className={cn(
                      PANEL_CARD,
                      'relative overflow-hidden p-4 text-left transition-all hover:shadow-md',
                      selectedTable?.id === table.id ? 'ring-2 ring-[#7EB8B3] ring-offset-2' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full opacity-20',
                        visual.color
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2D5A57]">{table.number}</span>
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-white',
                          visual.color
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-2">
                      <StatusBadge status={displayStatus} />
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{table.capacity} personas</span>
                    </div>

                    {(table.currentTotal ?? 0) > 0 && (
                      <div
                        className="mt-2 rounded-lg px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${COTY_QTY_BG}99`, color: COTY_TEAL }}
                      >
                        Total acumulado · {formatPrice(table.currentTotal!)}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && handleCloseTableDialog()}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-gray-100 dark:border-border p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-gray-100 dark:border-border px-6 pb-3 pt-6">
            <DialogTitle className="flex items-center justify-between gap-2 text-[#2D5A57]">
              {addProductOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddProductOpen(false)
                    setSearchQuery('')
                  }}
                  className="flex items-center gap-1.5 text-[#2D5A57]"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Agregar producto</span>
                </button>
              ) : (
                <span>Mesa {selectedTable?.number}</span>
              )}
              {!addProductOpen && selectedTable && <StatusBadge status={selectedTable.status} />}
            </DialogTitle>
            {!addProductOpen && accumulatedTotal > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-[#F0FAF8] px-3 py-2 dark:bg-primary/10">
                <span className="text-xs font-medium text-[#2D5A57]/80">Total acumulado de la mesa</span>
                <span className="text-base font-bold text-[#2D5A57]">
                  {formatPrice(accumulatedTotal)}
                </span>
              </div>
            )}
            {addProductOpen && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-gray-200 dark:border-border bg-[#F8FBFA] pl-9 dark:bg-muted"
                />
              </div>
            )}
          </DialogHeader>

          {addProductOpen ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryProducts = filteredProducts.filter((p) => p.categoryId === category.id)
                  if (categoryProducts.length === 0) return null

                  return (
                    <div key={category.id}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {categoryProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductClick(product)}
                            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 dark:border-border bg-white p-2 text-left transition-colors hover:bg-[#F8FBFA] dark:bg-card dark:hover:bg-muted"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                            </div>
                            <Plus className="h-5 w-5 text-[#7EB8B3]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron productos
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-3">
                {sessionOrders.length > 0 && (
                  <Collapsible open={sessionOrdersOpen} onOpenChange={setSessionOrdersOpen}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-gray-100 dark:border-border bg-[#F8FBFA] px-3 py-2 text-left dark:bg-muted">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                        Pedidos en curso ({sessionOrders.length})
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-[#2D5A57] transition-transform',
                          sessionOrdersOpen && 'rotate-180'
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {sessionOrders.map((order) => (
                        <div key={order.id} className="rounded-xl border border-gray-100 dark:border-border bg-[#F8FBFA] p-3 text-sm dark:bg-muted">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium">{order.displayCode ?? 'Pedido'}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <ul className="space-y-1 text-muted-foreground">
                            {order.items.map((item) => (
                              <li key={item.id}>
                                {item.quantity}x {item.product.name} · {formatPrice(item.product.price * item.quantity)}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-right font-semibold text-[#2D5A57]">{formatPrice(order.total)}</p>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {orderItems.length === 0 ? (
                  <EmptyState
                    icon="cart"
                    title="Nuevos productos"
                    description={
                      selectedTable?.status === 'free'
                        ? 'Ocupá la mesa para empezar a cargar productos'
                        : 'Agregá productos al próximo pedido de esta mesa'
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                        Nuevo pedido
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {orderItems.reduce((sum, item) => sum + item.quantity, 0)} u.
                      </span>
                    </div>
                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 dark:border-border bg-[#F8FBFA] p-2 dark:bg-muted"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(
                                getDiscountedUnitPrice(item.product, item.selectedOptions, promotions) * item.quantity
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn('h-7 w-7', PANEL_OUTLINE_BTN)}
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn('h-7 w-7', PANEL_OUTLINE_BTN)}
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {orderItems.length > 0 && (
                <div className="border-t border-gray-100 dark:border-border px-6 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal nuevo pedido</span>
                    <span>{formatPrice(newItemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA ({Math.round(taxRate * 100)}%)</span>
                    <span>{formatPrice(newItemsTax)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-gray-100 dark:border-border pt-1 font-bold">
                    <span>Total nuevo pedido</span>
                    <span className="text-[#2D5A57]">{formatPrice(newItemsTotal)}</span>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col gap-2 border-t border-gray-100 dark:border-border px-6 py-4 sm:flex-row">
                {selectedTable?.status === 'free' && (
                  <Button
                    className={PANEL_PRIMARY_BTN}
                    disabled={isBusy}
                    onClick={() => selectedTable && void handleOccupyTable(selectedTable)}
                  >
                    {isPending(`occupy:${selectedTable.id}`) ? (
                      <>
                        <Spinner className="mr-2" />
                        Procesando...
                      </>
                    ) : (
                      'Ocupar mesa'
                    )}
                  </Button>
                )}

                {selectedTable && ['occupied', 'waiting'].includes(selectedTable.status) && (
                  <>
                    <Button
                      variant="outline"
                      className={cn('gap-2', PANEL_OUTLINE_BTN)}
                      onClick={() => setAddProductOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar producto
                    </Button>

                    {orderItems.length > 0 && (
                      <Button
                        className={PANEL_PRIMARY_BTN}
                        disabled={isBusy}
                        onClick={() => void handleSendOrder()}
                      >
                        {isPending(`send:${selectedTable.id}`) ? (
                          <>
                            <Spinner className="mr-2" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar pedido'
                        )}
                      </Button>
                    )}

                    {(sessionOrders.length > 0 || accumulatedTotal > 0) && (
                      <Button
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => selectedTable && void handleMarkReadyToPay(selectedTable)}
                      >
                        {isPending(`ready:${selectedTable.id}`) ? (
                          <>
                            <Spinner className="mr-2" />
                            Procesando...
                          </>
                        ) : (
                          'Listo para cobrar'
                        )}
                      </Button>
                    )}
                  </>
                )}

                {selectedTable?.status === 'finished' && (
                  <Button
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => {
                      setClosePaymentMethod('cash')
                      setPaymentDialogOpen(true)
                    }}
                  >
                    Cobrar y cerrar mesa
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="border-gray-100 dark:border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2D5A57]">
              Cobrar mesa {selectedTable?.number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className={cn(PANEL_CARD, 'bg-[#F0FAF8] p-4 text-center dark:bg-primary/10')}>
              <p className="text-sm text-muted-foreground">Total a cobrar</p>
              <p className="text-3xl font-bold text-[#2D5A57]">
                {formatPrice(accumulatedTotal)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <RadioGroup
                value={closePaymentMethod}
                onValueChange={(value) => setClosePaymentMethod(value as PaymentMethod)}
                className="grid gap-2"
              >
                {CLOSE_PAYMENT_METHODS.map((method) => (
                  <div key={method} className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-border p-3">
                    <RadioGroupItem value={method} id={`close-pay-${method}`} />
                    <Label htmlFor={`close-pay-${method}`} className="flex-1 cursor-pointer font-normal">
                      {PAYMENT_METHOD_LABELS[method]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className={PANEL_PRIMARY_BTN}
              disabled={isBusy || !selectedTable}
              onClick={() => void handleConfirmClose()}
            >
              {selectedTable && isPending(`close:${selectedTable.id}`) ? (
                <>
                  <Spinner className="mr-2" />
                  Cobrando...
                </>
              ) : (
                'Confirmar cobro'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {productPicker && (
        <ProductDetailModal
          product={productPicker}
          promotions={promotions}
          onClose={() => setProductPicker(null)}
          onAddToCart={(product, quantity, options, notes) => {
            handleAddProductItem(product, quantity, options, notes)
            setProductPicker(null)
            setAddProductOpen(false)
          }}
        />
      )}
    </div>
  )
}
