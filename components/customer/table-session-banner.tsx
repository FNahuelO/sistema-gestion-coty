'use client'

import { X, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COTY_HEADER, COTY_TEAL } from '@/lib/coty-theme'
import { useTableSession } from '@/lib/store'

type TableSessionBannerProps = {
  className?: string
  showClear?: boolean
}

export function TableSessionBanner({ className, showClear = true }: TableSessionBannerProps) {
  const { tableSession, isLoading, error, clearTableSession } = useTableSession()

  if (isLoading) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-[#C5DDD9] bg-[#F8FBFA] px-4 py-3 text-sm text-[#2D5A57]">
          Identificando tu mesa...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}. Escaneá nuevamente el QR de tu mesa.
        </div>
      </div>
    )
  }

  if (!tableSession) return null

  return (
    <div className={className}>
      <div
        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: COTY_HEADER }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <UtensilsCrossed className="h-5 w-5" style={{ color: COTY_TEAL }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Estás en la Mesa {tableSession.tableNumber}</p>
            <p className="text-xs text-white/75">Tu pedido se enviará directo al salón.</p>
          </div>
        </div>
        {showClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
            onClick={clearTableSession}
            aria-label="Salir de la mesa"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
