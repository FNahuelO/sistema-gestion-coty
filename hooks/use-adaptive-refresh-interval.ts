'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  adaptiveRefreshInterval,
  type AdaptivePollingInput,
} from '@/lib/adaptive-polling'
import { useDocumentHidden } from '@/hooks/use-document-hidden'
import { useInServiceWindow } from '@/hooks/use-service-window'

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
 * Ajusta la agresividad según tráfico, `isOpen`, visibilidad, horario de atención y madrugada AR.
 * La identidad cambia al entrar/salir de horario para que SWR reprograme el polling.
 */
export function useAdaptiveRefreshInterval<T = unknown>(
  baseMs: number,
  options: Options<T> = {}
): (data: T | undefined) => number {
  const isDocumentHidden = useDocumentHidden()
  const inServiceWindow = useInServiceWindow(baseMs > 0 && options.enabled !== false)
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
        inServiceWindow,
      } satisfies AdaptivePollingInput)
    },
    [baseMs, isDocumentHidden, inServiceWindow]
  )
}
