'use client'

import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShoppingBag,
  ChefHat,
  Armchair,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ORDER_STATUS_LABELS, formatOrderNumber } from '@/lib/order-labels'
import { OrderNotificationsButton } from '@/components/customer/order-notifications-button'
import { shouldShowOrderEstimate } from '@/lib/order-estimate'
import { useOrderCountdown } from '@/hooks/use-order-countdown'
import type { CartItem, Order, OrderStatus } from '@/lib/types'
import { COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Pendiente', icon: Clock },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle2 },
  { status: 'preparing', label: 'Preparando', icon: ChefHat },
  { status: 'ready', label: 'Listo', icon: CheckCircle2 },
]

export const CUSTOMER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'border-amber-400 bg-amber-100 text-amber-950',
  confirmed: 'border-[#2D5A57] bg-[#C5DDD9] text-[#053E38]',
  preparing: 'border-orange-400 bg-orange-100 text-orange-950',
  ready: 'border-emerald-500 bg-emerald-100 text-emerald-950',
  delivered: 'border-emerald-500 bg-emerald-100 text-emerald-950',
  completed: 'border-gray-400 bg-gray-100 text-gray-900',
  cancelled: 'border-red-400 bg-red-100 text-red-950',
}

export function CustomerOrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold shadow-sm',
        CUSTOMER_STATUS_STYLES[status]
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

function getStepIndex(status: OrderStatus) {
  if (status === 'cancelled') return -1
  if (status === 'completed' || status === 'delivered') return statusSteps.length
  return statusSteps.findIndex((step) => step.status === status)
}

export function getOrderLabel(order: Order) {
  return formatOrderNumber(order)
}

function getOrderTypeLabel(order: Order) {
  switch (order.type) {
    case 'delivery':
      return 'Delivery'
    case 'pickup':
      return 'Retiro en local'
    default:
      return order.tableNumber ? `Mesa ${order.tableNumber}` : 'Mesa'
  }
}

function OrderTypeIcon({ order }: { order: Order }) {
  if (order.type === 'delivery') return <Truck className="h-4 w-4 shrink-0 text-[#7EB8B3]" />
  if (order.type === 'table') return <Armchair className="h-4 w-4 shrink-0 text-[#7EB8B3]" />
  return <ShoppingBag className="h-4 w-4 shrink-0 text-[#7EB8B3]" />
}

export function CustomerOrderProgress({ order }: { order: Order }) {
  const currentStep = getStepIndex(order.status)
  const isComplete = order.status === 'completed' || order.status === 'delivered'
  const progressRatio = isComplete ? 1 : Math.max(0, currentStep / (statusSteps.length - 1))

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-5 h-[2px] -translate-y-1/2 bg-[#E8F0EF]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-5 h-[2px] -translate-y-1/2 transition-all duration-500"
        style={{
          left: '12.5%',
          width: `calc(75% * ${progressRatio})`,
          backgroundColor: COTY_TEAL,
        }}
        aria-hidden
      />
      <div className="relative flex w-full">
        {statusSteps.map((step, stepIndex) => {
          const StepIcon = step.icon
          const isActive = stepIndex <= currentStep || isComplete
          const isCurrent = stepIndex === currentStep && !isComplete

          return (
            <div key={step.status} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={cn(
                  'relative z-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isActive
                    ? 'border-[#2D5A57] text-white'
                    : 'border-[#D6E8E6] bg-white text-[#9BB8B5]'
                )}
                style={isActive ? { backgroundColor: COTY_TEAL } : undefined}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'mt-2 w-full px-0.5 text-center text-[10px] leading-tight',
                  isActive ? 'font-semibold text-[#2D5A57]' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
              {isCurrent ? <span className="sr-only">Estado actual</span> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderLineItem({ item }: { item: CartItem }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0 flex-1 text-left">
        <p className="font-medium text-foreground">
          {item.quantity}x {item.product.name}
        </p>
        {item.selectedOptions.length > 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.selectedOptions.flatMap((option) => option.choiceIds).join(', ')}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 font-medium text-[#2D5A57]">
        {formatPrice(item.product.price * item.quantity)}
      </span>
    </div>
  )
}

function OrderItemsSummary({ order }: { order: Order }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFA] p-4">
      <h4 className="mb-3 text-center text-sm font-semibold text-[#2D5A57]">Tu pedido</h4>
      <div className="space-y-2">
        {order.items.map((item) => (
          <OrderLineItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-[#D6E8E6] pt-3 text-sm">
        <div className="flex justify-between gap-4 text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.deliveryFee ? (
          <div className="flex justify-between gap-4 text-muted-foreground">
            <span>Envío</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
        ) : null}
        {order.discountAmount ? (
          <div className="flex justify-between gap-4 text-emerald-700">
            <span>Descuento</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        ) : null}
        {order.tax > 0 ? (
          <div className="flex justify-between gap-4 text-muted-foreground">
            <span>Impuestos</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
        ) : null}
        {order.tip ? (
          <div className="flex justify-between gap-4 text-muted-foreground">
            <span>{order.type === 'table' ? 'Servicio' : 'Propina'}</span>
            <span>{formatPrice(order.tip)}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 pt-1 text-base font-bold text-[#053E38]">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {order.publicTrackingCode ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Código de seguimiento:{' '}
          <span className="font-mono font-medium text-[#2D5A57]">{order.publicTrackingCode}</span>
        </p>
      ) : null}
    </div>
  )
}

export function OrderEstimatedTime({ order }: { order: Order }) {
  const countdown = useOrderCountdown(order)

  if (!shouldShowOrderEstimate(order.status)) return null

  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-[#F8FBFA] px-3 py-2.5 text-sm text-[#2D5A57]">
      <Clock className="h-4 w-4 shrink-0 text-[#7EB8B3]" />
      {countdown.isReady ? (
        <span className="font-bold">{countdown.label}</span>
      ) : (
        <span>
          Tiempo estimado: <span className="font-bold tabular-nums">{countdown.label}</span>
        </span>
      )}
    </div>
  )
}

export function CustomerOrderCard({ order }: { order: Order }) {
  const isCancelled = order.status === 'cancelled'

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-5 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-base font-bold text-[#053E38]">Pedido {getOrderLabel(order)}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {order.offlinePending ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
                Pendiente de envío
              </span>
            ) : null}
            <CustomerOrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5">
        {!isCancelled ? <CustomerOrderProgress order={order} /> : null}

        {isCancelled ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">Pedido cancelado</span>
          </div>
        ) : null}

        <OrderItemsSummary order={order} />

        <OrderEstimatedTime order={order} />

        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#F8FBFA] px-3 py-2.5 text-sm text-[#2D5A57]">
          <OrderTypeIcon order={order} />
          <span className="font-medium">{getOrderTypeLabel(order)}</span>
        </div>

        {!isCancelled && shouldShowOrderEstimate(order.status) ? (
          <OrderNotificationsButton orderId={order.id} />
        ) : null}
      </div>
    </article>
  )
}
