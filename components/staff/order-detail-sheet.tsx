'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MapPin,
  Phone,
  Store,
  Truck,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/shared/status-badge'
import { COTY_HEADER, COTY_QTY_BG, COTY_TEAL, formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import type { Order, OrderStatus, OrderType } from '@/lib/types'
import { cn } from '@/lib/utils'

import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS, getPaymentStatusLabel, isDisplayableCustomerPhone } from '@/lib/order-labels'
import { DeliveryAssignmentPanel } from '@/components/staff/delivery-assignment-panel'

const ORDER_TYPE_META: Record<
  OrderType,
  { label: string; icon: LucideIcon; accent: string }
> = {
  delivery: { label: ORDER_TYPE_LABELS.delivery, icon: Truck, accent: 'border-l-[#E8A598]' },
  pickup: { label: ORDER_TYPE_LABELS.pickup, icon: Store, accent: 'border-l-[#7EB8B3]' },
  table: { label: ORDER_TYPE_LABELS.table, icon: Users, accent: 'border-l-[#2D5A57]' },
}

function getItemOptionsLabel(order: Order, itemId: string) {
  const item = order.items.find((entry) => entry.id === itemId)
  if (!item?.selectedOptions?.length) return null

  return item.selectedOptions
    .map((opt) => {
      const productOpt = item.product.options?.find((candidate) => candidate.id === opt.optionId)
      return opt.choiceIds
        .map((choiceId) => productOpt?.choices.find((choice) => choice.id === choiceId)?.name)
        .filter(Boolean)
        .join(', ')
    })
    .filter(Boolean)
    .join(' · ')
}

type OrderDetailSheetProps = {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  statusAction: { next: OrderStatus; label: string } | null
  onAdvanceStatus: (orderId: string, status: OrderStatus) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
  onArchive: (orderId: string) => Promise<void>
  onDeliveryUpdated?: () => void
  isPending: (key: string) => boolean
  isBusy: boolean
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  statusAction,
  onAdvanceStatus,
  onCancel,
  onArchive,
  onDeliveryUpdated,
  isPending,
  isBusy,
}: OrderDetailSheetProps) {
  if (!order) return null

  const typeMeta = ORDER_TYPE_META[order.type]
  const TypeIcon = typeMeta.icon
  const isFinished = ['completed', 'cancelled'].includes(order.status)
  const statusPending = isPending(`status:${order.id}`)
  const cancelPending = isPending(`cancel:${order.id}`)
  const archivePending = isPending(`archive:${order.id}`)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          'flex h-full w-full flex-col gap-0 overflow-hidden border-gray-100 p-0 sm:max-w-md',
          '[&>button]:top-4 [&>button]:right-4 [&>button]:text-white [&>button]:opacity-90 [&>button]:hover:bg-white/10 [&>button]:hover:opacity-100'
        )}
      >
        <div className="shrink-0 px-5 pb-5 pt-6 text-white" style={{ backgroundColor: COTY_HEADER }}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Detalle del pedido</p>
          <h2 className="mt-1 font-serif text-2xl font-bold leading-tight">
            {order.displayCode ?? `#${order.id}`}
          </h2>
          <p className="mt-1 text-xs text-white/75">
            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
            {' · '}
            {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} variant="onDark" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <TypeIcon className="h-3.5 w-3.5" />
              {typeMeta.label}
              {order.tableNumber ? ` · Mesa ${order.tableNumber}` : null}
            </span>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 bg-[#FAFAFA]">
          <div className="space-y-4 p-4">
            <section className={cn(PANEL_CARD, 'overflow-hidden p-0')}>
              <div className={cn('border-b border-gray-100 px-4 py-3', 'bg-[#F8FBFA]')}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                  Cliente
                </h3>
              </div>
              <div className="space-y-2 px-4 py-3">
                <p className="font-semibold text-foreground">{order.customerName}</p>
                {isDisplayableCustomerPhone(order.customerPhone) ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#7EB8B3]" />
                    {order.customerPhone}
                  </p>
                ) : null}
                {order.customerAddress ? (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7EB8B3]" />
                    <span>{order.customerAddress}</span>
                  </p>
                ) : null}
              </div>
            </section>

            {order.type === 'delivery' ? (
              <DeliveryAssignmentPanel order={order} onUpdated={onDeliveryUpdated} />
            ) : null}

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                Productos ({order.items.length})
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => {
                  const optionsLabel = getItemOptionsLabel(order, item.id)
                  const lineTotal = item.product.price * item.quantity

                  return (
                    <div
                      key={item.id}
                      className={cn(PANEL_LIST_ROW, 'border-l-4', typeMeta.accent, 'p-3')}
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-snug">{item.product.name}</p>
                            <span
                              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: COTY_QTY_BG, color: COTY_TEAL }}
                            >
                              {formatPrice(lineTotal)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.quantity} × {formatPrice(item.product.price)}
                          </p>
                          {optionsLabel ? (
                            <p className="mt-1 text-xs text-[#2D5A57]/80">{optionsLabel}</p>
                          ) : null}
                          {item.notes ? (
                            <p className="mt-1 text-xs italic text-muted-foreground">{item.notes}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {order.notes ? (
              <section className={cn(PANEL_CARD, 'p-4')}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                  Notas del pedido
                </h3>
                <p className="text-sm leading-relaxed text-foreground">{order.notes}</p>
              </section>
            ) : null}

            <section className={cn(PANEL_CARD, 'p-4')}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2D5A57]/70">
                Pago
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              </div>
              {order.paymentStatus ? (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estado del pago</span>
                  <span className="font-medium">{getPaymentStatusLabel(order)}</span>
                </div>
              ) : null}
            </section>
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-gray-100 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>IVA</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-base font-semibold text-foreground">Total</span>
              <span className="font-serif text-2xl font-bold text-[#2D5A57]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {statusAction && !isFinished ? (
              <Button
                className={cn('h-11 w-full text-base', PANEL_PRIMARY_BTN)}
                disabled={isBusy}
                onClick={async () => {
                  await onAdvanceStatus(order.id, statusAction.next)
                  onOpenChange(false)
                }}
              >
                {statusPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  statusAction.label
                )}
              </Button>
            ) : null}

            {!isFinished ? (
              <Button
                variant="outline"
                disabled={isBusy}
                className="h-11 w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                onClick={async () => {
                  await onCancel(order.id)
                  onOpenChange(false)
                }}
              >
                {cancelPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar pedido
                  </>
                )}
              </Button>
            ) : null}

            {isFinished ? (
              <Button
                variant="outline"
                disabled={isBusy}
                className={cn('h-11 w-full', PANEL_OUTLINE_BTN)}
                onClick={async () => {
                  await onArchive(order.id)
                  onOpenChange(false)
                }}
              >
                {archivePending ? (
                  <>
                    <Spinner className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Sacar de operaciones'
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
