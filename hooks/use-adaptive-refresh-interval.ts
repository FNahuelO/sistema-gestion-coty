'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  adaptiveRefreshInterval,
  type AdaptivePollingInput,
} from '@/lib/adaptive-polling'
import { useDocumentHidden } from '@/hooks/use-document-hidden'

type Options<T> = {
  enabled?: boolean
  isOpen?: boolean | null
  /** Cuenta actividad a partir del último payload de SWR. */
  getActiveCount?: (data: T | undefined) => number
  /** Conteo estático cuando no hace falta mirar el payload. */
  activeCount?: number
}

/**
 * Devuelve un `refreshInterval` compatible con SWR (función).
 * Ajusta la agresividad según tráfico, `isOpen` y visibilidad de la pestaña.
 */
export function useAdaptiveRefreshInterval<T = unknown>(
  baseMs: number,
  options: Options<T> = {}
): (data: T | undefined) => number {
  const isDocumentHidden = useDocumentHidden()
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  return useMemo(
    () => (data: T | undefined) => {
      const {
        enabled = true,
        isOpen,
        getActiveCount,
        activeCount,
      } = optionsRef.current
      if (!enabled || baseMs <= 0) return 0
      return adaptiveRefreshInterval({
        baseMs,
        activeCount: getActiveCount?.(data) ?? activeCount ?? 0,
        isOpen,
        isDocumentHidden,
      } satisfies AdaptivePollingInput)
    },
    [baseMs, isDocumentHidden]
  )
}
