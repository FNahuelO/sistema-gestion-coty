'use client'

import { useState } from 'react'
import { X, UtensilsCrossed, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COTY_HEADER } from '@/lib/coty-theme'
import { cn } from '@/lib/utils'
import { useTableSession } from '@/lib/store'
import { toast } from 'sonner'

type TableSessionBannerProps = {
  className?: string
  showClear?: boolean
  variant?: 'standalone' | 'inline'
}

export function TableSessionBanner({
  className,
  showClear = true,
  variant = 'standalone',
}: TableSessionBannerProps) {
  const { tableSession, isLoading, error, clearTableSession } = useTableSession()
  const [calling, setCalling] = useState(false)

  const callWaiter = async () => {
    if (!tableSession) return
    setCalling(true)
    try {
      const response = await fetch('/api/table-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: tableSession.tableId }),
      })
      if (!response.ok) throw new Error('No se pudo llamar al mozo')
      toast.success('¡Mozo avisado! En breve te atienden.')
    } catch {
      toast.error('No se pudo enviar la solicitud')
    } finally {
      setCalling(false)
    }
  }

  if (isLoading) {
    if (variant === 'inline') {
      return (
        <div className={cn('mt-3 rounded-2xl bg-white/10 px-3 py-2.5', className)}>
          <p className="text-sm text-white/80">Identificando tu mesa...</p>
        </div>
      )
    }

    return (
      <div className={className}>
        <div className="rounded-2xl border border-[#C5DDD9] bg-[#F8FBFA] px-4 py-3 text-sm text-[#2D5A57]">
          Identificando tu mesa...
        </div>
      </div>
    )
  }

  if (error) {
    if (variant === 'inline') {
      return (
        <div className={cn('mt-3 rounded-2xl bg-red-500/20 px-3 py-2.5', className)}>
          <p className="text-sm text-white">{error}. Escaneá nuevamente el QR de tu mesa.</p>
        </div>
      )
    }

    return (
      <div className={className}>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}. Escaneá nuevamente el QR de tu mesa.
        </div>
      </div>
    )
  }

  if (!tableSession) return null

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3 py-2.5',
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
            <UtensilsCrossed className="h-4 w-4" style={{ color: '#6baca5' }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Estás en la Mesa {tableSession.tableNumber}
            </p>
            <p className="truncate text-[11px] text-white/70">Tu pedido se enviará directo al salón.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
            onClick={() => void callWaiter()}
            disabled={calling}
            aria-label="Llamar al mozo"
          >
            <BellRing className="h-4 w-4" />
          </Button>
          {showClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white"
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
            <UtensilsCrossed className="h-5 w-5" style={{ color: "#6baca5" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Estás en la Mesa {tableSession.tableNumber}</p>
            <p className="text-xs text-white/75">Tu pedido se enviará directo al salón.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => void callWaiter()}
            disabled={calling}
            aria-label="Llamar al mozo"
          >
            <BellRing className="h-4 w-4" />
          </Button>
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
    </div>
  )
}
