'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PANEL_LIST_ROW, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'

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
  const { data, mutate, isLoading } = useSWR<TableCall[]>('/api/table-calls', fetchJson, {
    refreshInterval: 5000,
  })

  const patch = async (id: string, action: 'acknowledge' | 'resolve') => {
    try {
      await fetch('/api/table-calls', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      await mutate()
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
                <Button size="sm" className={PANEL_PRIMARY_BTN} onClick={() => void patch(call.id, 'acknowledge')}>
                  Atender
                </Button>
                <Button size="sm" variant="outline" onClick={() => void patch(call.id, 'resolve')}>
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
