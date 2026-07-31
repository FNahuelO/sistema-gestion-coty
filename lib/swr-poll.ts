'use client'

import { useEffect, useState } from 'react'
import { arHour } from '@/lib/datetime'

/** Madrugada AR: reduce presión de polling en plan Hobby. */
const QUIET_HOUR_START = 1
const QUIET_HOUR_END = 7

export const POLL_SWR_DEFAULTS = {
  refreshWhenHidden: false,
  revalidateOnFocus: true,
} as const

/** Intervalo efectivo: 0 si la pestaña está oculta; ×4 (mín. 2 min) de madrugada. */
export function resolvePollInterval(baseMs: number, now = new Date()): number {
  if (typeof document !== 'undefined' && document.hidden) return 0
  const hour = arHour(now)
  if (hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END) {
    return Math.max(baseMs * 4, 120_000)
  }
  return baseMs
}

/** Intervalo reactivo a visibilitychange y al paso de la madrugada. */
export function usePollInterval(baseMs: number): number {
  const [ms, setMs] = useState(() => (baseMs > 0 ? resolvePollInterval(baseMs) : 0))

  useEffect(() => {
    if (baseMs <= 0) {
      setMs(0)
      return
    }

    const sync = () => setMs(resolvePollInterval(baseMs))
    sync()
    document.addEventListener('visibilitychange', sync)
    const id = window.setInterval(sync, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.clearInterval(id)
    }
  }, [baseMs])

  return ms
}
