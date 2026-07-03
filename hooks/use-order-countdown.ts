'use client'

import { useEffect, useState } from 'react'
import { getOrderEstimatedMinutes, getOrderEstimatedReadyAt } from '@/lib/order-estimate'
import type { Order } from '@/lib/types'

export type OrderCountdown = {
  /** Texto listo para mostrar: "mm:ss", "N min" (previo al montaje) o mensaje de listo. */
  label: string
  /** Milisegundos restantes hasta el tiempo estimado (0 si ya venció). */
  remainingMs: number
  /** El contador llegó a cero (el pedido debería estar listo). */
  isReady: boolean
  /** El intervalo ya arrancó en el cliente. */
  mounted: boolean
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Contador regresivo hacia el tiempo estimado del pedido. Se actualiza cada
 * segundo. Antes del montaje muestra los minutos totales para evitar desajustes
 * de hidratación. Cuando el personal actualiza el tiempo estimado, el servidor
 * recalcula el ancla (`estimatedReadyAt`) y el contador arranca desde cero.
 */
export function useOrderCountdown(order: Order): OrderCountdown {
  const targetMs = getOrderEstimatedReadyAt(order).getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (now === null) {
    return {
      label: `${getOrderEstimatedMinutes(order)} min`,
      remainingMs: getOrderEstimatedMinutes(order) * 60_000,
      isReady: false,
      mounted: false,
    }
  }

  const remainingMs = Math.max(0, targetMs - now)
  if (remainingMs <= 0) {
    return { label: '¡Casi listo!', remainingMs: 0, isReady: true, mounted: true }
  }

  return { label: formatCountdown(remainingMs), remainingMs, isReady: false, mounted: true }
}
