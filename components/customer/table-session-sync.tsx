'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { MESA_QUERY_PARAM } from '@/lib/menu-url'
import { useTableSession } from '@/lib/store'

export function TableSessionSync() {
  const searchParams = useSearchParams()
  const { tableSession, resolveTable } = useTableSession()
  const lastResolvedRef = useRef<string | null>(null)

  useEffect(() => {
    const mesaId = searchParams.get(MESA_QUERY_PARAM)?.trim()
    if (!mesaId) return
    if (tableSession?.tableId === mesaId || lastResolvedRef.current === mesaId) return

    lastResolvedRef.current = mesaId
    void resolveTable(mesaId)
      .then((session) => {
        toast.success(`Mesa ${session.tableNumber} identificada`)
      })
      .catch((error: unknown) => {
      lastResolvedRef.current = null
      toast.error(error instanceof Error ? error.message : 'No se pudo identificar la mesa')
      })
  }, [searchParams, tableSession?.tableId, resolveTable])

  return null
}
