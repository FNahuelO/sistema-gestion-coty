'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import { toast } from 'sonner'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PANEL_LIST_ROW, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'
import { POLL_SWR_DEFAULTS, usePollInterval } from '@/lib/swr-poll'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

type TableCall = {
  id: string
  createdAt: string
  table: { number: number }
}

export function CallsSection() {
  const refreshInterval = usePollInterval(15_000)
  const { data, mutate, isLoading } = useSWR<TableCall[]>('/api/table-calls', fetchJson, {
    ...POLL_SWR_DEFAULTS,
    refreshInterval,
  })

  const patch = async (id: string, action: 'acknowledge' | 'resolve') => {
    try {
      await fetch('/api/table-calls', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      await Promise.all([mutate(), globalMutate('/api/staff/alerts')])
      toast.success(action === 'acknowledge' ? 'Llamado atendido' : 'Llamado resuelto')
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const calls = data ?? []

  return (
    <div className="space-y-3">
      {calls.length === 0 ? (
        <p className="text-center text-muted-foreground">Sin llamados de mesa</p>
      ) : (
        calls.map((call) => (
          <div key={call.id} className={PANEL_LIST_ROW}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-[#E8A598]" />
                <div>
                  <p className="font-semibold">Mesa {call.table.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(call.createdAt).toLocaleTimeString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className={PANEL_PRIMARY_BTN} onClick={() => patch(call.id, 'acknowledge')}>
                  Atender
                </Button>
                <Button size="sm" variant="outline" onClick={() => patch(call.id, 'resolve')}>
                  Listo
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
