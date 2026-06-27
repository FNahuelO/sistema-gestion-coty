'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import { UserRound } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DeliveryQueueEntry } from '@/lib/types'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al cargar')
  }
  return res.json()
}

type Runner = { id: string; name: string }

export function AssignRunnerSelect({
  orderId,
  runner,
  assignmentStatus,
  onAssigned,
  disabled = false,
  compact = false,
  allowReassign = true,
}: {
  orderId: string
  runner?: { id: string; name: string } | null
  assignmentStatus?: DeliveryQueueEntry['assignmentStatus']
  onAssigned?: (entry: DeliveryQueueEntry) => void
  disabled?: boolean
  compact?: boolean
  allowReassign?: boolean
}) {
  const { data: runners = [] } = useSWR<Runner[]>('/api/staff/operations?view=runners', fetchJson)

  const assign = async (runnerId: string) => {
    try {
      const res = await fetch('/api/staff/operations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_runner', orderId, runnerId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? 'No se pudo asignar')
      }
      onAssigned?.(body as DeliveryQueueEntry)
      toast.success(runner ? 'Cadete actualizado' : 'Cadete asignado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo asignar')
    }
  }

  const canReassign =
    allowReassign && assignmentStatus !== 'picked_up' && assignmentStatus !== 'delivered'

  if (runner && !canReassign) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-[#C5DDD9]/50 px-2.5 py-1 text-xs font-medium text-[#2D5A57]',
          compact && 'px-2 py-0.5'
        )}
      >
        <UserRound className="h-3.5 w-3.5" />
        {runner.name}
      </span>
    )
  }

  if (runner && canReassign) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D5A57]">
          <UserRound className="h-3.5 w-3.5" />
          {runner.name}
        </span>
        <Select disabled={disabled} onValueChange={(runnerId) => void assign(runnerId)}>
          <SelectTrigger className={cn('h-8 border-gray-200 bg-white dark:border-border dark:bg-card', compact ? 'w-28' : 'w-32')}>
            <SelectValue placeholder="Cambiar" />
          </SelectTrigger>
          <SelectContent>
            {runners.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (runners.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Sin cadetes activos
      </span>
    )
  }

  return (
    <Select disabled={disabled} onValueChange={(runnerId) => void assign(runnerId)}>
      <SelectTrigger className={cn('h-9 border-gray-200 bg-white dark:border-border dark:bg-card', compact ? 'w-36' : 'w-40')}>
        <SelectValue placeholder="Asignar cadete" />
      </SelectTrigger>
      <SelectContent>
        {runners.map((candidate) => (
          <SelectItem key={candidate.id} value={candidate.id}>
            {candidate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
