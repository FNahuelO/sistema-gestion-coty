'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PANEL_LIST_ROW, PANEL_PRIMARY_BTN } from '@/lib/panel-theme'
import { Spinner } from '@/components/ui/spinner'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

type Assignment = {
  orderId: string
  status: string
  runner?: { id: string; name: string }
  order: { displayCode?: string; customerName: string; customerAddress?: string }
}

export function DeliverySection() {
  const { data, mutate, isLoading } = useSWR<Assignment[]>(
    '/api/staff/operations?view=delivery',
    fetchJson,
    { refreshInterval: 12000 }
  )
  const { data: runners = [] } = useSWR<Array<{ id: string; name: string }>>(
    '/api/staff/operations?view=runners',
    fetchJson
  )

  const assign = async (orderId: string, runnerId: string) => {
    try {
      await fetch('/api/staff/operations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_runner', orderId, runnerId }),
      })
      await mutate()
      toast.success('Cadete asignado')
    } catch {
      toast.error('No se pudo asignar')
    }
  }

  const updateStatus = async (orderId: string, status: 'picked_up' | 'delivered') => {
    try {
      await fetch('/api/staff/operations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      await mutate()
      toast.success('Estado actualizado')
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

  return (
    <div className="space-y-3">
      {(data ?? []).length === 0 ? (
        <p className="text-center text-muted-foreground">Sin entregas activas</p>
      ) : (
        (data ?? []).map((entry) => (
          <div key={entry.orderId} className={PANEL_LIST_ROW}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{entry.order.displayCode ?? entry.orderId}</p>
                <p className="text-sm text-muted-foreground">{entry.order.customerName}</p>
                {entry.order.customerAddress ? (
                  <p className="text-xs text-muted-foreground">{entry.order.customerAddress}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {entry.runner ? (
                  <span className="text-xs font-medium">{entry.runner.name}</span>
                ) : (
                  <Select onValueChange={(runnerId) => void assign(entry.orderId, runnerId)}>
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue placeholder="Asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {runners.map((runner) => (
                        <SelectItem key={runner.id} value={runner.id}>
                          {runner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {entry.status === 'ASSIGNED' ? (
                  <Button size="sm" className={PANEL_PRIMARY_BTN} onClick={() => void updateStatus(entry.orderId, 'picked_up')}>
                    Retirado
                  </Button>
                ) : null}
                {entry.status === 'PICKED_UP' ? (
                  <Button size="sm" className={PANEL_PRIMARY_BTN} onClick={() => void updateStatus(entry.orderId, 'delivered')}>
                    Entregado
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
