'use client'

import { useState, useMemo, useEffect, useRef, type ElementType } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Store,
  Users,
  Clock,
  CheckCircle,
  Search,
  Filter,
  ChefHat,
  Package,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrders } from '@/lib/store'
import { usePendingAction } from '@/hooks/use-pending-action'
import { OrderDetailSheet } from '@/components/staff/order-detail-sheet'
import { StaffNotificationsButton } from '@/components/staff/staff-notifications-button'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatOrderStatus, isDisplayableCustomerPhone } from '@/lib/order-labels'
import { canApproveTransferPayment } from '@/lib/payment-flow'
import { ORDER_SORT_OPTIONS, sortOrders, type OrderSortKey } from '@/lib/order-sort'
import type { DeliveryQueueEntry, Order, OrderStatus, OrderType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'
import { formatDeliveryAssignmentStatus } from '@/lib/delivery-labels'
import { cn } from '@/lib/utils'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

const orderTypeIcons: Record<OrderType, ElementType> = {
  delivery: Truck,
  pickup: Store,
  table: Users,
}

const ORDER_TYPE_ACCENT: Record<OrderType, string> = {
  delivery: 'border-l-[#E8A598]',
  pickup: 'border-l-[#7EB8B3]',
  table: 'border-l-[#2D5A57]',
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

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: number
  icon: ElementType
  iconColor: string
}) {
  return (
    <div className={cn(PANEL_CARD, 'flex items-center gap-3 p-4')}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${COTY_QTY_BG}99` }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function OrdersSection({
  embedded = false,
  onNavigateToCalls,
}: {
  embedded?: boolean
  onNavigateToCalls?: () => void
}) {
  const { orders, updateOrderStatus, closeOrder, approveOrderPayment } = useOrders()
  const { data: deliveryQueue = [], mutate: mutateDeliveryQueue } = useSWR<DeliveryQueueEntry[]>(
    '/api/staff/operations?view=delivery',
    fetchJson,
    { refreshInterval: 12000 }
  )
  const deliveryByOrderId = useMemo(
    () => new Map(deliveryQueue.map((entry) => [entry.orderId, entry])),
    [deliveryQueue]
  )
  const { isPending, isBusy, run } = usePendingAction()
  const previousPendingCount = useRef<number | null>(null)
  const [selectedTab, setSelectedTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [sortBy, setSortBy] = useState<OrderSortKey>('status')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedTab !== 'all' && order.type !== selectedTab) return false

      if (statusFilter === 'active') {
        if (['completed', 'cancelled'].includes(order.status)) return false
      } else if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

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

  const sortedOrders = useMemo(
    () => sortOrders(filteredOrders, sortBy),
    [filteredOrders, sortBy]
  )

  const orderStats = useMemo(() => {
    const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status))
    return {
      pending: active.filter((o) => o.status === 'pending').length,
      preparing: active.filter((o) => o.status === 'preparing').length,
      ready: active.filter((o) => o.status === 'ready').length,
      total: active.length,
    }
  }, [orders])

  useEffect(() => {
    const pending = orderStats.pending
    if (previousPendingCount.current !== null && pending > previousPendingCount.current) {
      try {
        const context = new AudioContext()
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.frequency.value = 880
        gain.gain.value = 0.08
        oscillator.start()
        oscillator.stop(context.currentTime + 0.25)
      } catch {
        // ignore audio errors
      }
    }
    previousPendingCount.current = pending
  }, [orderStats.pending])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await run(`status:${orderId}`, async () => {
      try {
        await updateOrderStatus(orderId, newStatus)
        toast.success(`Pedido actualizado a: ${formatOrderStatus(newStatus)}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el pedido')
        throw error
      }
    })
  }

  const handleApprovePayment = async (orderId: string) => {
    await run(`approve:${orderId}`, async () => {
      try {
        await approveOrderPayment(orderId)
        toast.success('Pago aprobado. El pedido quedó confirmado.')
        setSelectedOrder(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo aprobar el pago')
        throw error
      }
    })
  }

  const handleCancelOrder = async (orderId: string) => {
    await run(`cancel:${orderId}`, async () => {
      try {
        await updateOrderStatus(orderId, 'cancelled')
        toast.success('Pedido cancelado')
        setSelectedOrder(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cancelar el pedido')
        throw error
      }
    })
  }

  const handleCloseOrder = async (orderId: string) => {
    await run(`archive:${orderId}`, async () => {
      try {
        await closeOrder(orderId)
        toast.success('Pedido archivado (permanece en historial)')
        setSelectedOrder(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo archivar el pedido')
        throw error
      }
    })
  }

  return (
    <div className={cn('flex flex-col', !embedded && 'min-h-screen bg-[#FAFAFA] dark:bg-background')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Pendientes" value={orderStats.pending} icon={Clock} iconColor="#CA8A04" />
          <StatCard label="Preparando" value={orderStats.preparing} icon={ChefHat} iconColor="#EA580C" />
          <StatCard label="Listos" value={orderStats.ready} icon={CheckCircle} iconColor="#16A34A" />
          <StatCard label="Activos" value={orderStats.total} icon={Package} iconColor={COTY_TEAL} />
        </div>

        <div className={cn(PANEL_CARD, 'p-4')}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-gray-200 bg-[#F8FBFA] pl-9 dark:border-border dark:bg-muted"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-gray-200 bg-[#F8FBFA] md:w-44 dark:border-border dark:bg-muted">
                <Filter className="mr-2 h-4 w-4 text-[#2D5A57]" />
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
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as OrderSortKey)}>
              <SelectTrigger className="w-full border-gray-200 bg-[#F8FBFA] md:w-52 dark:border-border dark:bg-muted">
                <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-[#2D5A57]" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StaffNotificationsButton
              orders={orders}
              onSelectOrder={setSelectedOrder}
              onNavigateToCalls={onNavigateToCalls}
            />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-[#F8FBFA] p-1 dark:bg-muted [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="all"
              className="min-h-11 shrink-0 gap-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              <Package className="h-4 w-4" />
              Todos
              <Badge variant="secondary" className="ml-1 bg-[#C5DDD9]/60 text-[#2D5A57]">
                {orders.filter((o) =>
                  statusFilter === 'active' ? !['completed', 'cancelled'].includes(o.status) : true
                ).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="min-h-11 shrink-0 gap-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger
              value="pickup"
              className="min-h-11 shrink-0 gap-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              <Store className="h-4 w-4" />
              Recoger
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="min-h-11 shrink-0 gap-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#2D5A57] data-[state=active]:shadow-sm dark:data-[state=active]:bg-card"
            >
              <Users className="h-4 w-4" />
              Mesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            {sortedOrders.length === 0 ? (
              <div className={PANEL_CARD}>
                <EmptyState
                  icon="package"
                  title="Sin pedidos"
                  description="No hay pedidos que coincidan con los filtros"
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence>
                  {sortedOrders.map((order, index) => {
                    const TypeIcon = orderTypeIcons[order.type]
                    const awaitingTransferProof = canApproveTransferPayment(order)
                    const action = order.offlinePending
                      ? null
                      : awaitingTransferProof
                        ? { type: 'approve' as const, label: 'Aprobar pago' }
                        : statusActions[order.status]
                          ? { type: 'status' as const, ...statusActions[order.status]! }
                          : null
                    const deliveryEntry =
                      order.type === 'delivery' ? deliveryByOrderId.get(order.id) : undefined

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className={cn(
                            PANEL_LIST_ROW,
                            'w-full border-l-4 text-left transition-colors hover:bg-[#F8FBFA] dark:hover:bg-muted',
                            ORDER_TYPE_ACCENT[order.type],
                            order.status === 'pending' && 'bg-[#FFFBEB]/80 dark:bg-amber-950/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${COTY_QTY_BG}99` }}
                              >
                                <TypeIcon className="h-4 w-4" style={{ color: COTY_TEAL }} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground">
                                  {order.displayCode ?? `#${order.id}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {awaitingTransferProof && (
                                <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-900 hover:bg-emerald-100">
                                  Esperando comprobante
                                </Badge>
                              )}
                              {order.offlinePending && (
                                <Badge className="border-0 bg-amber-100 text-[10px] text-amber-900 hover:bg-amber-100">
                                  Sin enviar
                                </Badge>
                              )}
                              {deliveryEntry ? (
                                <Badge
                                  className={cn(
                                    'border-0 text-[10px] hover:bg-inherit',
                                    deliveryEntry.assignmentStatus === 'unassigned'
                                      ? 'bg-amber-100 text-amber-900'
                                      : deliveryEntry.assignmentStatus === 'picked_up'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-[#C5DDD9]/70 text-[#2D5A57]'
                                  )}
                                >
                                  {formatDeliveryAssignmentStatus(deliveryEntry.assignmentStatus)}
                                </Badge>
                              ) : null}
                              <StatusBadge status={order.status} />
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 pl-12 text-sm">
                            <p className="font-medium dark:text-white">{order.customerName}</p>
                            {isDisplayableCustomerPhone(order.customerPhone) && (
                              <p className="text-muted-foreground">{order.customerPhone}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {order.items.slice(0, 2).map((item) => (
                                <p key={item.id}>
                                  {item.quantity}x {item.product.name}
                                </p>
                              ))}
                              {order.items.length > 2 && (
                                <p>+{order.items.length - 2} más...</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 pl-12 dark:border-border">
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
                            >
                              {formatPrice(order.total)}
                            </span>
                            {action && (
                              <Button
                                size="sm"
                                className={PANEL_PRIMARY_BTN}
                                disabled={isBusy}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (action.type === 'approve') {
                                    void handleApprovePayment(order.id)
                                    return
                                  }
                                  void handleStatusChange(order.id, action.next)
                                }}
                              >
                                {isPending(
                                  action.type === 'approve' ? `approve:${order.id}` : `status:${order.id}`
                                ) ? (
                                  <>
                                    <Spinner className="mr-1.5" />
                                    ...
                                  </>
                                ) : (
                                  action.label
                                )}
                              </Button>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OrderDetailSheet
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        statusAction={
          selectedOrder?.offlinePending || (selectedOrder && canApproveTransferPayment(selectedOrder))
            ? null
            : selectedOrder
              ? statusActions[selectedOrder.status]
              : null
        }
        onAdvanceStatus={handleStatusChange}
        onApprovePayment={handleApprovePayment}
        onCancel={handleCancelOrder}
        onArchive={handleCloseOrder}
        onDeliveryUpdated={() => void mutateDeliveryQueue()}
        isPending={isPending}
        isBusy={isBusy}
      />
    </div>
  )
}
