'use client'

import { useEffect, useState } from 'react'
import { applyQuietHours } from '@/lib/adaptive-polling'

export const POLL_SWR_DEFAULTS = {
  refreshWhenHidden: false,
  revalidateOnFocus: true,
} as const

/** Intervalo efectivo: 0 si la pestaña está oculta; ×4 (mín. 2 min) de madrugada. */
export function resolvePollInterval(baseMs: number, now = new Date()): number {
  if (baseMs <= 0) return 0
  if (typeof document !== 'undefined' && document.hidden) return 0
  return applyQuietHours(baseMs, now)
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
