'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee,
  LogOut,
  Menu,
  Bell,
  Truck,
  Store,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChefHat,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth, useOrders } from '@/lib/store'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { Order, OrderStatus, OrderType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

const orderTypeIcons: Record<OrderType, React.ElementType> = {
  delivery: Truck,
  pickup: Store,
  table: Users,
}

const orderTypeLabels: Record<OrderType, string> = {
  delivery: 'Delivery',
  pickup: 'Recoger',
  table: 'Mesa',
}

const statusActions: Record<OrderStatus, { next: OrderStatus; label: string } | null> = {
  pending: { next: 'confirmed', label: 'Confirmar' },
  confirmed: { next: 'preparing', label: 'Preparar' },
  preparing: { next: 'ready', label: 'Listo' },
  ready: { next: 'delivered', label: 'Entregar' },
  delivered: { next: 'completed', label: 'Completar' },
  completed: null,
  cancelled: null,
}

export function CashierDashboard() {
  const { user, logout } = useAuth()
  const { orders, updateOrderStatus } = useOrders()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (selectedTab !== 'all' && order.type !== selectedTab) return false

      // Status filter
      if (statusFilter === 'active') {
        if (['completed', 'cancelled'].includes(order.status)) return false
      } else if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerPhone?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [orders, selectedTab, statusFilter, searchQuery])

  const orderStats = useMemo(() => {
    const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
    return {
      pending: active.filter(o => o.status === 'pending').length,
      preparing: active.filter(o => o.status === 'preparing').length,
      ready: active.filter(o => o.status === 'ready').length,
      total: active.length,
    }
  }, [orders])

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus)
    toast.success(`Pedido actualizado a: ${newStatus}`)
  }

  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled')
    toast.success('Pedido cancelado')
    setSelectedOrder(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-primary" />
                    Coty Café
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Avatar>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">Cajero/a</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={async () => {
                      await logout()
                      window.location.href = '/login'
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-serif text-lg font-bold">Pedidos</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {orderStats.pending > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {orderStats.pending}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container px-4 py-4 mx-auto">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderStats.preparing}</p>
                <p className="text-xs text-muted-foreground">Preparando</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderStats.ready}</p>
                <p className="text-xs text-muted-foreground">Listos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderStats.total}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="container px-4 pb-4 mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, cliente o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Listos</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Tabs */}
      <div className="container flex-1 px-4 pb-6 mx-auto">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="gap-1.5">
              <Package className="h-4 w-4" />
              Todos
              <Badge variant="secondary" className="ml-1">
                {orders.filter(o => statusFilter === 'active' ? !['completed', 'cancelled'].includes(o.status) : true).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5">
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="pickup" className="gap-1.5">
              <Store className="h-4 w-4" />
              Recoger
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5">
              <Users className="h-4 w-4" />
              Mesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            {filteredOrders.length === 0 ? (
              <EmptyState
                icon="package"
                title="Sin pedidos"
                description="No hay pedidos que coincidan con los filtros"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredOrders.map((order, index) => {
                    const TypeIcon = orderTypeIcons[order.type]
                    const action = statusActions[order.status]

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${order.status === 'pending' ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20' : ''
                            }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  <TypeIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm">#{order.id}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              {order.customerPhone && (
                                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.items.slice(0, 2).map(item => (
                                <p key={item.id}>
                                  {item.quantity}x {item.product.name}
                                </p>
                              ))}
                              {order.items.length > 2 && (
                                <p className="text-xs">+{order.items.length - 2} más...</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="font-serif text-lg font-bold">
                                ${order.total.toFixed(2)}
                              </span>
                              {action && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(order.id, action.next)
                                  }}
                                >
                                  {action.label}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pedido #{selectedOrder?.id}</SheetTitle>
          </SheetHeader>

          {selectedOrder && (
            <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
              <div className="space-y-6 py-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <StatusBadge status={selectedOrder.status} />
                </div>

                {/* Type */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const TypeIcon = orderTypeIcons[selectedOrder.type]
                      return <TypeIcon className="h-4 w-4" />
                    })()}
                    <span>{orderTypeLabels[selectedOrder.type]}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="mb-2 font-medium">Cliente</h3>
                  <p>{selectedOrder.customerName}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                  )}
                  {selectedOrder.customerAddress && (
                    <p className="mt-2 text-sm">{selectedOrder.customerAddress}</p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h3 className="mb-3 font-medium">Productos</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x ${item.product.price}
                          </p>
                        </div>
                        <span className="font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="mb-2 font-medium">Notas</h3>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="rounded-lg border p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA</span>
                      <span>${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="font-serif">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {statusActions[selectedOrder.status] && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleStatusChange(
                          selectedOrder.id,
                          statusActions[selectedOrder.status]!.next
                        )
                        setSelectedOrder(null)
                      }}
                    >
                      {statusActions[selectedOrder.status]!.label}
                    </Button>
                  )}
                  {!['completed', 'cancelled'].includes(selectedOrder.status) && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
