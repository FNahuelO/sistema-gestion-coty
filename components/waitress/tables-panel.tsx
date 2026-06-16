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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCatalog, useOrders, useTables } from '@/lib/store'
import { usePendingAction } from '@/hooks/use-pending-action'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { Table, Product, CartItem, TableStatus } from '@/lib/types'
import { toast } from 'sonner'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const tableStatusColors: Record<TableStatus, string> = {
  free: 'bg-[#7EB8B3]',
  occupied: 'bg-[#2D5A57]',
  waiting: 'bg-[#EAB308]',
  finished: 'bg-[#053E38]',
}

const tableStatusIcons: Record<TableStatus, React.ElementType> = {
  free: CheckCircle,
  occupied: Coffee,
  waiting: Clock,
  finished: CreditCard,
}

export function WaitressPanel({ embedded = false }: { embedded?: boolean }) {
  const { tables, updateTableStatus, closeTable, createTableOrder } = useTables()
  const { orders } = useOrders()
  const { products, categories } = useCatalog()
  const { isPending, isBusy, run } = usePendingAction()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('tables')

  const activeTableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.type === 'table' &&
          !['completed', 'cancelled'].includes(order.status)
      ),
    [orders]
  )

  const getTableOrder = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId)
    if (table?.currentOrderId) {
      return orders.find((o) => o.id === table.currentOrderId)
    }
    return null
  }

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table)
    const existingOrder = getTableOrder(table.id)
    if (existingOrder) {
      setOrderItems([...existingOrder.items])
    } else {
      setOrderItems([])
    }
  }

  const handleAddProduct = (product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          product,
          quantity: 1,
          selectedOptions: [],
        },
      ]
    })
    toast.success(`${product.name} agregado`)
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

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  const handleSendOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return

    await run(`send:${selectedTable.id}`, async () => {
      try {
        await createTableOrder(selectedTable.id, {
          items: orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
            notes: item.notes,
          })),
        })
        toast.success('Pedido enviado a cocina')
        setSelectedTable(null)
        setOrderItems([])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo enviar el pedido')
        throw error
      }
    })
  }

  const handleCloseTable = async (table: Table) => {
    await run(`close:${table.id}`, async () => {
      try {
        await closeTable(table.id)
        toast.success(`Mesa ${table.number} cerrada`)
        setSelectedTable(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la mesa')
        throw error
      }
    })
  }

  const handleMarkOccupied = async (table: Table) => {
    await run(`occupied:${table.id}`, async () => {
      try {
        await updateTableStatus(table.id, 'occupied')
        toast.success(`Mesa ${table.number} marcada como ocupada`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mesa')
        throw error
      }
    })
  }

  const handleMarkReady = async (table: Table) => {
    await run(`ready:${table.id}`, async () => {
      try {
        await updateTableStatus(table.id, 'finished')
        toast.success(`Mesa ${table.number} lista para cobrar`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la mesa')
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

  return (
    <div className={cn(!embedded && 'min-h-screen bg-[#FAFAFA]')}>
      <div className={cn(embedded ? 'space-y-4' : 'w-full px-4 py-6 sm:px-6 lg:px-8')}>
        <div className={cn(PANEL_CARD, 'flex flex-wrap items-center gap-2 p-3')}>
          <Badge variant="outline" className="gap-1.5 border-[#C5DDD9] text-[#2D5A57]">
            <span className="h-2 w-2 rounded-full bg-[#7EB8B3]" />
            {tables.filter((t) => t.status === 'free').length} libres
          </Badge>
          {Object.entries(tableStatusColors).map(([status, color]) => {
            const Icon = tableStatusIcons[status as TableStatus]
            const count = tables.filter((t) => t.status === status).length
            return (
              <Badge key={status} variant="outline" className="gap-1.5 border-gray-200">
                <span className={cn('h-2 w-2 rounded-full', color)} />
                <Icon className="h-3 w-3 text-[#2D5A57]" />
                <StatusBadge status={status as TableStatus} className="border-0 bg-transparent p-0" />
                <span className="text-muted-foreground">({count})</span>
              </Badge>
            )
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-auto w-full gap-1 bg-[#F8FBFA] p-1">
            <TabsTrigger
              value="tables"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm"
            >
              Mapa de mesas
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm"
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
                        {order.items.length} productos
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
                const StatusIcon = tableStatusIcons[table.status]
                const order = getTableOrder(table.id)

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
                      selectedTable?.id === table.id
                        ? 'ring-2 ring-[#7EB8B3] ring-offset-2'
                        : ''
                    )}
                  >
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full opacity-20',
                        tableStatusColors[table.status]
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <span className="font-serif text-2xl font-bold text-[#2D5A57]">{table.number}</span>
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-white',
                          tableStatusColors[table.status]
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-2">
                      <StatusBadge status={table.status} />
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{table.capacity} personas</span>
                    </div>

                    {order && (
                      <div
                        className="mt-2 rounded-lg px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${COTY_QTY_BG}99`, color: COTY_TEAL }}
                      >
                        {order.items.length} productos · {formatPrice(order.total)}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-[#2D5A57]">
              <span>Mesa {selectedTable?.number}</span>
              {selectedTable && <StatusBadge status={selectedTable.status} />}
            </DialogTitle>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {orderItems.length === 0 ? (
                <EmptyState
                  icon="cart"
                  title="Sin productos"
                  description="Agregá productos al pedido de esta mesa"
                />
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#F8FBFA] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.product.price)} c/u
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn('h-7 w-7', PANEL_OUTLINE_BTN)}
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
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
              <div className={cn(PANEL_CARD, 'p-3')}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span>{formatPrice(calculateTotal() * 0.16)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-bold">
                  <span>Total</span>
                  <span className="font-serif text-[#2D5A57]">
                    {formatPrice(calculateTotal() * 1.16)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className={cn('gap-2', PANEL_OUTLINE_BTN)}
              onClick={() => setAddProductOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Agregar producto
            </Button>

            {selectedTable?.status === 'waiting' && (
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => selectedTable && void handleMarkOccupied(selectedTable)}
              >
                {isPending(`occupied:${selectedTable.id}`) ? (
                  <>
                    <Spinner className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Marcar ocupada'
                )}
              </Button>
            )}

            {selectedTable?.status === 'occupied' && (
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => selectedTable && void handleMarkReady(selectedTable)}
              >
                {isPending(`ready:${selectedTable.id}`) ? (
                  <>
                    <Spinner className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Marcar listo'
                )}
              </Button>
            )}

            {selectedTable?.status === 'finished' && (
              <Button
                variant="destructive"
                disabled={isBusy}
                onClick={() => selectedTable && void handleCloseTable(selectedTable)}
              >
                {isPending(`close:${selectedTable.id}`) ? (
                  <>
                    <Spinner className="mr-2" />
                    Cerrando...
                  </>
                ) : (
                  'Cerrar mesa'
                )}
              </Button>
            )}

            {orderItems.length > 0 && selectedTable?.status !== 'finished' && (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-h-[90vh] border-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#2D5A57]">Agregar producto</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-200 bg-[#F8FBFA] pl-9"
            />
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="space-y-4 pr-4">
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
                          onClick={() => handleAddProduct(product)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-2 text-left transition-colors hover:bg-[#F8FBFA]"
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
