'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellRing, CheckCircle2, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerOrderCard } from '@/components/customer/customer-order-tracking'
import { CustomerOrderStatusListSkeleton } from '@/components/shared/loading'
import { useTrackedOrders } from '@/lib/store'
import { COTY_HEADER, COTY_TEAL } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'

const PAGE_SHELL = 'relative z-10 mx-auto w-full max-w-lg px-4'

function ConfirmationHeader() {
  return (
    <div
      className="w-full rounded-b-4xl md:rounded-b-[2.5rem]"
      style={{ backgroundColor: COTY_HEADER }}
    >
      <div className={cn(PAGE_SHELL, 'pb-10 pt-8 text-center md:pb-12 md:pt-10')}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
          <CheckCircle2 className="h-8 w-8 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-white md:text-2xl">¡Pedido enviado!</h1>
        <p className="mt-1 text-sm text-white/80 md:text-base">
          Seguí el estado de tu pedido en tiempo real
        </p>
      </div>
    </div>
  )
}

export function OrderConfirmationView({
  orderId,
  menuHref,
  tableId,
}: {
  orderId: string
  menuHref: string
  tableId?: string
}) {
  const [calling, setCalling] = useState(false)
  const { orders, isLoading } = useTrackedOrders('', orderId)
  const order = orders.find((candidate) => candidate.id === orderId) ?? orders[0]
  const isTable = order?.type === 'table'
  const waiterTableId = tableId

  const callWaiter = async () => {
    if (!waiterTableId) return
    setCalling(true)
    try {
      const response = await fetch('/api/table-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: waiterTableId }),
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
    <div className="coly-landing min-h-screen bg-white pb-28 md:pb-10">
      <ConfirmationHeader />

      <main className={cn(PAGE_SHELL, 'py-6')}>
        {isLoading && !order ? (
          <CustomerOrderStatusListSkeleton count={1} />
        ) : order ? (
          <CustomerOrderCard order={order} />
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
            <p className="font-semibold text-[#053E38]">Cargando tu pedido...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si no aparece en unos segundos, podés verlo en Mis pedidos.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
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

          {isTable && waiterTableId ? (
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
              style={{ borderColor: COTY_TEAL, color: COTY_TEAL }}
            >
              Ver todos mis pedidos
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
