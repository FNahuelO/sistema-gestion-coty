'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, CheckCircle2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart, useTableSession, useTrackedOrders } from '@/lib/store'
import {
  buildCleanUrlWithoutMpReturn,
  clearMpPendingOrder,
  clearMpRedirecting,
  markMpReturnHandled,
  wasMpReturnAlreadyHandled,
} from '@/lib/mercadopago-return'
import { buildMenuPathWithTable } from '@/lib/menu-url'
import { CustomerOrderCard } from '@/components/customer/customer-order-tracking'
import { EmptyState } from '@/components/shared/empty-state'
import { CustomerOrderStatusListSkeleton } from '@/components/shared/loading'
import { toast } from 'sonner'
import { COTY_HEADER, COTY_TEAL } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'

const PAGE_SHELL = 'relative z-10 mx-auto w-full max-w-lg px-4'

function OrderStatusHeader({
  searchId,
  onSearchChange,
}: {
  searchId: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div
      className="w-full rounded-b-4xl md:rounded-b-[2.5rem]"
      style={{ backgroundColor: COTY_HEADER }}
    >
      <div className={cn(PAGE_SHELL, 'pb-10 pt-8 text-center md:pb-12 md:pt-10')}>
        <h1 className="text-xl font-bold text-white md:text-2xl">Mis pedidos</h1>
        <p className="mt-1 text-sm text-white/80 md:text-base">
          Seguí el estado de tus pedidos en tiempo real
        </p>

        <div className="relative mt-5 text-left md:mt-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por código de pedido..."
            value={searchId}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-white py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5DDD9]"
          />
        </div>
      </div>
    </div>
  )
}

function PaymentReturnNotice({ status }: { status: string | null }) {
  if (status === 'approved') {
    return (
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Pago aprobado
        </div>
        <p className="mt-1 text-emerald-800">Tu pedido fue confirmado. Acá podés seguir el estado en tiempo real.</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <Clock className="h-4 w-4 shrink-0" />
          Pago pendiente
        </div>
        <p className="mt-1 text-amber-800">Mercado Pago está procesando el pago. Actualizaremos el estado cuando se acredite.</p>
      </div>
    )
  }

  return null
}

function OrderStatusContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paymentReturnOrderId =
    searchParams.get('external_reference')?.trim() ||
    searchParams.get('orderId')?.trim() ||
    null
  const [searchId, setSearchId] = useState('')
  const [returnNoticeStatus, setReturnNoticeStatus] = useState<string | null>(null)
  const { tableSession } = useTableSession()
  const { clearCart } = useCart()
  const { orders, isLoading } = useTrackedOrders(searchId, paymentReturnOrderId)
  const menuHref = tableSession ? buildMenuPathWithTable(tableSession.tableId) : '/menu'

  useEffect(() => {
    const status = searchParams.get('status')
    if (status !== 'approved' && status !== 'pending') return

    const orderId = paymentReturnOrderId
    const cleanUrl = buildCleanUrlWithoutMpReturn(pathname, searchParams)

    clearMpRedirecting()

    if (wasMpReturnAlreadyHandled(orderId, status)) {
      router.replace(cleanUrl)
      return
    }

    markMpReturnHandled(orderId, status)
    setReturnNoticeStatus(status)

    if (status === 'approved') {
      clearMpPendingOrder()
      clearCart()
      toast.success('¡Pago confirmado! Tu pedido ya está en preparación.')
    } else {
      toast.message('Pago pendiente de confirmación')
    }

    router.replace(cleanUrl)
  }, [searchParams, pathname, router, paymentReturnOrderId, clearCart])

  const visibleOrders = orders

  return (
    <div className="coly-landing min-h-screen bg-white pb-24 md:pb-10">
      <OrderStatusHeader searchId={searchId} onSearchChange={setSearchId} />

      <main className={cn(PAGE_SHELL, 'py-6')}>
        <PaymentReturnNotice status={returnNoticeStatus} />

        {isLoading && visibleOrders.length === 0 ? (
          <CustomerOrderStatusListSkeleton />
        ) : visibleOrders.length === 0 && paymentReturnOrderId ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
            <Clock className="mx-auto mb-3 h-8 w-8 text-[#7EB8B3]" />
            <p className="font-semibold text-[#053E38]">Confirmando tu pago</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estamos cargando tu pedido. Si no aparece en unos segundos, buscalo por el código que recibiste.
            </p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-4 py-8 shadow-sm">
            <EmptyState
              icon="package"
              title="Sin pedidos"
              description={
                searchId
                  ? 'No encontramos pedidos con ese código'
                  : 'Cuando hagas un pedido, vas a poder seguirlo desde acá'
              }
              action={{
                label: 'Ir al menú',
                onClick: () => {
                  window.location.href = menuHref
                },
              }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {visibleOrders.map((order) => (
              <CustomerOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {visibleOrders.length > 0 ? (
          <div className="mt-8 flex justify-center">
            <Link href={menuHref} className="w-full max-w-xs">
              <Button
                className="w-full rounded-full py-6 font-bold shadow-md"
                style={{ backgroundColor: COTY_TEAL }}
              >
                Hacer otro pedido
              </Button>
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="coly-landing min-h-screen bg-white pb-24">
          <div className="h-44 rounded-b-4xl" style={{ backgroundColor: COTY_HEADER }} />
          <div className={cn(PAGE_SHELL, 'py-6')}>
            <CustomerOrderStatusListSkeleton count={1} />
          </div>
        </div>
      }
    >
      <OrderStatusContent />
    </Suspense>
  )
}
