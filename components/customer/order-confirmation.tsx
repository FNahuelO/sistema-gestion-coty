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
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  COTY_HEADER,
  COTY_MINT,
  COTY_PAGE_BG,
  COTY_TEAL,
  LOGO_SRC_SVG,
} from '@/lib/coty-theme'
import type { OrderStatus, OrderType } from '@/lib/types'

type StepConfig = {
  label: string
  icon: React.ElementType
}

const TABLE_STEPS: StepConfig[] = [
  { label: 'En preparación', icon: ChefHat },
  { label: 'Listo para servir', icon: UtensilsCrossed },
  { label: 'En camino', icon: Truck },
  { label: 'Entregado', icon: CheckCircle2 },
]

const PICKUP_STEPS: StepConfig[] = [
  { label: 'En preparación', icon: ChefHat },
  { label: 'Listo para retirar', icon: ShoppingBag },
  { label: 'Entregado', icon: CheckCircle2 },
]

const DELIVERY_STEPS: StepConfig[] = [
  { label: 'En preparación', icon: ChefHat },
  { label: 'Listo', icon: CheckCircle2 },
  { label: 'En camino', icon: Truck },
  { label: 'Entregado', icon: CheckCircle2 },
]

function getSteps(orderType: OrderType): StepConfig[] {
  if (orderType === 'table') return TABLE_STEPS
  if (orderType === 'delivery') return DELIVERY_STEPS
  return PICKUP_STEPS
}

function getStepIndex(status: OrderStatus, orderType: OrderType): number {
  const steps = getSteps(orderType)
  if (status === 'cancelled') return -1
  if (status === 'completed' || status === 'delivered') return steps.length - 1
  if (status === 'ready') return Math.min(steps.length - 2, steps.length - 1)
  if (status === 'preparing' || status === 'confirmed' || status === 'pending') return 0
  return 0
}

function getStatusHighlight(status: OrderStatus, orderType: OrderType) {
  const stepIndex = getStepIndex(status, orderType)
  const steps = getSteps(orderType)
  const current = steps[Math.max(0, stepIndex)] ?? steps[0]

  const subtitles: Record<string, string> = {
    'En preparación': 'Tu pedido ya está en cocina',
    'Listo para servir': 'Tu pedido está listo para llevar a la mesa',
    'Listo para retirar': 'Ya podés pasar a retirarlo por el mostrador',
    Listo: 'Tu pedido está listo',
    'En camino': orderType === 'delivery' ? 'Tu pedido va en camino' : 'El mozo está llevando tu pedido',
    Entregado: '¡Buen provecho!',
  }

  return {
    label: current.label,
    subtitle: subtitles[current.label] ?? 'Seguimos actualizando tu pedido',
    icon: current.icon,
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

function OrderProgressStepper({
  orderType,
  status,
}: {
  orderType: OrderType
  status: OrderStatus
}) {
  const steps = getSteps(orderType)
  const currentStep = getStepIndex(status, orderType)

  return (
    <div className="relative mt-4">
      <div
        className="pointer-events-none absolute left-[12%] right-[12%] top-5 h-px border-t border-dashed border-[#D6D6D6]"
        aria-hidden
      />
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = index <= currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.label} className="flex w-[22%] flex-col items-center">
              <div
                className={cn(
                  'relative z-1 flex h-10 w-10 items-center justify-center rounded-full border-2',
                  isActive
                    ? 'border-amber-400 bg-amber-400 text-white'
                    : 'border-[#E5E5E5] bg-white text-[#B0B0B0]'
                )}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'mt-2 text-center text-[9px] leading-tight',
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OrderConfirmationView({
  orderId,
  orderType,
  tableNumber,
  tableId,
  menuHref,
  estimatedMinutes = 20,
  status = 'preparing',
}: {
  orderId: string
  orderType: OrderType
  tableNumber?: number
  tableId?: string
  menuHref: string
  estimatedMinutes?: number
  status?: OrderStatus
}) {
  const [calling, setCalling] = useState(false)
  const isTable = orderType === 'table'
  const highlight = getStatusHighlight(status, orderType)
  const HighlightIcon = highlight.icon

  const subtitle = isTable
    ? 'Estamos preparando tu pedido ☕'
    : orderType === 'delivery'
      ? 'Recibimos tu pedido y lo estamos preparando para enviarlo'
      : 'Recibimos tu pedido y lo estamos preparando para que lo retires'

  const leftDetail = isTable
    ? { label: 'Mesa', value: `Mesa ${tableNumber}`, icon: Armchair }
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
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
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
            <p className="mt-0.5 text-sm font-bold text-foreground">#{orderId}</p>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-foreground">Estado del pedido</h2>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
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

            <OrderProgressStepper orderType={orderType} status={status} />
          </div>
        </section>

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
