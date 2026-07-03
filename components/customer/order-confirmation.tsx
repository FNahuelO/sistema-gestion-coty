'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ChefHat,
  Truck,
  BellRing,
  ChevronRight,
  UtensilsCrossed,
  ClipboardList,
  Armchair,
  Clock,
  ShoppingBag,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  COTY_HEADER,
  COTY_MINT,
  COTY_PAGE_BG,
  COTY_TEAL,
  LOGO_SRC_SVG,
} from '@/lib/coty-theme'
import {
  CustomerOrderProgress,
  getOrderLabel,
} from '@/components/customer/customer-order-tracking'
import { LoadingSkeleton } from '@/components/shared/loading'
import { getOrderEstimatedMinutes, shouldShowOrderEstimate } from '@/lib/order-estimate'
import { ORDER_STATUS_LABELS } from '@/lib/order-labels'
import { canApproveTransferPayment } from '@/lib/payment-flow'
import { useTrackedOrders } from '@/lib/store'
import type { Order, OrderType } from '@/lib/types'

function getStatusHighlight(order: Order) {
  const { status, type } = order

  if (status === 'ready') {
    const label =
      type === 'table' ? 'Listo para servir' : type === 'pickup' ? 'Listo para retirar' : 'Listo'
    const subtitle =
      type === 'table'
        ? 'Tu pedido está listo para llevar a la mesa'
        : type === 'pickup'
          ? 'Ya podés pasar a retirarlo por el mostrador'
          : 'Tu pedido está listo'
    return { label, subtitle, icon: type === 'delivery' ? Truck : CheckCircle2 }
  }

  if (status === 'delivered' || status === 'completed') {
    return { label: 'Entregado', subtitle: '¡Buen provecho!', icon: CheckCircle2 }
  }

  if (status === 'cancelled') {
    return { label: 'Cancelado', subtitle: 'Este pedido fue cancelado', icon: Clock }
  }

  if (status === 'confirmed') {
    return {
      label: ORDER_STATUS_LABELS.confirmed,
      subtitle: 'Tu pedido fue confirmado y pronto entra a cocina',
      icon: CheckCircle2,
    }
  }

  if (status === 'pending') {
    return {
      label: ORDER_STATUS_LABELS.pending,
      subtitle: 'Estamos confirmando tu pedido',
      icon: Clock,
    }
  }

  return {
    label: 'En preparación',
    subtitle: 'Tu pedido ya está en cocina',
    icon: ChefHat,
  }
}

function ClocheIllustration() {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-14 w-14 shrink-0"
      aria-hidden
    >
      <path d="M12 48h48" stroke={COTY_HEADER} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="36" cy="48" rx="24" ry="4" stroke={COTY_HEADER} strokeWidth="1.5" />
      <path
        d="M18 48c0-14 8-26 18-26s18 12 18 26"
        stroke={COTY_HEADER}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="20" r="2" fill={COTY_TEAL} />
      <path
        d="M28 14l1.5 2M44 14l-1.5 2M22 24l2 1M50 24l-2 1"
        stroke={COTY_TEAL}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ConfirmationHeader({
  tableNumber,
  backHref,
}: {
  tableNumber?: number
  backHref?: string
}) {
  return (
    <div className="w-full" style={{ backgroundColor: COTY_HEADER }}>
      <header className="relative mx-auto flex max-w-lg items-center justify-center px-4 py-5 md:max-w-4xl lg:max-w-6xl">
        {tableNumber != null ? (
          <>
            <div className="w-9" aria-hidden />
            <Link href="/" className="flex justify-center">
              <img
                src={LOGO_SRC_SVG}
                alt="Coty Café"
                className="h-11 w-auto object-contain mix-blend-screen"
              />
            </Link>
            <div
              className="absolute right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: COTY_MINT }}
            >
              <Armchair className="h-3.5 w-3.5" style={{ color: COTY_HEADER }} strokeWidth={2} />
              <span className="text-xs font-semibold" style={{ color: COTY_HEADER }}>
                Mesa {tableNumber}
              </span>
            </div>
          </>
        ) : (
          <Link href={backHref ?? '/'} className="flex justify-center">
            <img
              src={LOGO_SRC_SVG}
              alt="Coty Café"
              className="h-11 w-auto object-contain mix-blend-screen"
            />
          </Link>
        )}
      </header>
    </div>
  )
}

function getOrderSubtitle(orderType: OrderType, isTable: boolean) {
  if (isTable) return 'Estamos preparando tu pedido ☕'
  if (orderType === 'delivery') {
    return 'Recibimos tu pedido y lo estamos preparando para enviarlo'
  }
  return 'Recibimos tu pedido y lo estamos preparando para que lo retires'
}

export function OrderConfirmationView({
  orderId,
  menuHref,
  tableId,
  tableNumber: tableNumberFallback,
  whatsappCheckoutUrl: whatsappCheckoutUrlProp,
}: {
  orderId: string
  menuHref: string
  tableId?: string
  tableNumber?: number
  whatsappCheckoutUrl?: string
}) {
  const [calling, setCalling] = useState(false)
  const { orders, isLoading } = useTrackedOrders('', orderId)
  const order = orders.find((candidate) => candidate.id === orderId) ?? orders[0]

  const orderType = order?.type ?? (tableNumberFallback != null ? 'table' : 'pickup')
  const isTable = orderType === 'table'
  const tableNumber = order?.tableNumber ?? tableNumberFallback
  const displayCode = order ? getOrderLabel(order) : '...'
  const highlight = order ? getStatusHighlight(order) : null
  const HighlightIcon = highlight?.icon ?? ChefHat
  const estimatedMinutes = order && shouldShowOrderEstimate(order.status)
    ? getOrderEstimatedMinutes(order)
    : null
  const awaitingTransferProof = order ? canApproveTransferPayment(order) : false
  const whatsappCheckoutUrl = order?.whatsappCheckoutUrl ?? whatsappCheckoutUrlProp

  const leftDetail = isTable
    ? { label: 'Mesa', value: tableNumber != null ? `Mesa ${tableNumber}` : 'Mesa', icon: Armchair }
    : {
        label: 'Modalidad',
        value: orderType === 'delivery' ? 'Delivery' : 'Retiro en local',
        icon: orderType === 'delivery' ? Truck : ShoppingBag,
      }

  const LeftIcon = leftDetail.icon

  const callWaiter = async () => {
    if (!tableId) return
    setCalling(true)
    try {
      const response = await fetch('/api/table-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      })
      if (!response.ok) throw new Error('No se pudo llamar al mozo')
      toast.success('¡Mozo avisado! En breve te atienden.')
    } catch {
      toast.error('No se pudo enviar la solicitud')
    } finally {
      setCalling(false)
    }
  }

  return (
    <div className="coly-landing min-h-screen pb-28" style={{ backgroundColor: COTY_PAGE_BG }}>
      <ConfirmationHeader tableNumber={isTable ? tableNumber : undefined} backHref={menuHref} />

      <main className="mx-auto w-full max-w-lg px-4 py-6 md:max-w-md">
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: COTY_MINT }}
          >
            <Check className="h-10 w-10" style={{ color: COTY_HEADER }} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: COTY_HEADER }}>
            ¡Pedido enviado!
          </h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {getOrderSubtitle(orderType, isTable)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: COTY_HEADER }}
            >
              <LeftIcon className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs text-muted-foreground">{leftDetail.label}</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">{leftDetail.value}</p>
          </div>

          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: COTY_HEADER }}
            >
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs text-muted-foreground">Pedido</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">#{displayCode}</p>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-foreground">Estado del pedido</h2>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            {isLoading && !order ? (
              <div className="space-y-4">
                <LoadingSkeleton className="h-12 w-full rounded-xl" />
                <LoadingSkeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : order ? (
              <>
                {highlight ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
                      <HighlightIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-bold text-foreground">{highlight.label}</p>
                      <p className="text-sm text-muted-foreground">{highlight.subtitle}</p>
                    </div>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
                  </div>
                ) : null}

                <div className="mt-4">
                  <CustomerOrderProgress order={order} />
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Cargando el estado de tu pedido...
              </p>
            )}
          </div>
        </section>

        {estimatedMinutes != null ? (
          <section className="mt-4 flex items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-white px-4 py-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: COTY_HEADER }}
            >
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Tiempo estimado</p>
              <p className="text-lg font-bold text-foreground">{estimatedMinutes} min</p>
            </div>
            <ClocheIllustration />
          </section>
        ) : null}

        {awaitingTransferProof ? (
          <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Completá el pago por WhatsApp</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enviá el detalle del pedido y el comprobante de transferencia al negocio. Tu pedido se
                  confirmará cuando el local verifique el pago.
                </p>
                {whatsappCheckoutUrl ? (
                  <a
                    href={whatsappCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-95"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar pedido por WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-6 space-y-3">
          <Link
            href={menuHref}
            className="flex w-full items-center justify-between rounded-full px-5 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-95"
            style={{ backgroundColor: COTY_HEADER }}
          >
            <UtensilsCrossed className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-center">Seguir pidiendo</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <ChevronRight className="h-5 w-5 text-white" />
            </span>
          </Link>

          {isTable && tableId ? (
            <button
              type="button"
              onClick={() => void callWaiter()}
              disabled={calling}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 bg-white px-5 py-4 text-base font-bold transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{ borderColor: COTY_HEADER, color: COTY_HEADER }}
            >
              <BellRing className="h-5 w-5" />
              {calling ? 'Avisando...' : 'Llamar mozo'}
            </button>
          ) : (
            <Link
              href="/order-status"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 bg-white px-5 py-4 text-base font-bold transition-opacity hover:opacity-95"
              style={{ borderColor: COTY_HEADER, color: COTY_HEADER }}
            >
              Ver estado del pedido
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
