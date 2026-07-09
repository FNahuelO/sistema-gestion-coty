'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice } from '@/lib/coty-theme'
import { formatDateAR, formatDateTimeAR } from '@/lib/datetime'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { hasPermission, type SessionRoleContext } from '@/lib/permissions'
import { useAuth } from '@/lib/store'
import { useFormPanel } from '../hooks/use-form-panel'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'
import { Spinner } from '@/components/ui/spinner'

type CashFormMode = 'open' | 'movement' | 'close'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

type CashSession = {
  id: string
  status: string
  openingAmount: string | number
  closingAmount?: string | number | null
  expectedAmount?: string | number | null
  difference?: string | number | null
  openedAt: string
  closedAt?: string | null
  notes?: string | null
  openedByUser?: { name: string }
  movements?: Array<{ id: string; type: string; amount: string | number; description: string }>
}

const FORM_TITLES: Record<CashFormMode, string> = {
  open: 'Abrir caja',
  movement: 'Registrar movimiento',
  close: 'Cerrar caja',
}

function num(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

export function CashSection() {
  const { user } = useAuth()
  const roleContext = useMemo<SessionRoleContext>(
    () => ({
      role: user?.role === 'admin' ? 'admin' : 'staff',
      staffRole: user?.staffRole ?? null,
    }),
    [user]
  )
  const canOpenClose = hasPermission(roleContext, 'cashier:close')
  const canRegisterMovement = hasPermission(roleContext, 'cash:movement')

  const { open, setOpen, openPanel } = useFormPanel('cash')
  const [formMode, setFormMode] = useState<CashFormMode>('open')

  const { data, mutate, isLoading } = useSWR<{ open: CashSession | null; sessions: CashSession[] }>(
    '/api/admin/cash',
    fetchJson,
    { refreshInterval: 15000 }
  )

  const [openingAmount, setOpeningAmount] = useState('0')
  const [closingAmount, setClosingAmount] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [movement, setMovement] = useState({ type: 'expense', amount: '', description: '' })
  const [busy, setBusy] = useState(false)

  const openSession = data?.open

  const openForm = (mode: CashFormMode) => {
    setFormMode(mode)
    if (mode === 'open') setOpeningAmount('0')
    if (mode === 'movement') setMovement({ type: 'expense', amount: '', description: '' })
    if (mode === 'close') {
      setClosingAmount('')
      setCloseNotes('')
    }
    openPanel()
  }

  const post = async (url: string, body: unknown) => {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? 'Error')
      await mutate()
      setOpen(false)
      return payload
    } finally {
      setBusy(false)
    }
  }

  const handleOpen = async () => {
    try {
      await post('/api/admin/cash', { openingAmount: Number(openingAmount) })
      toast.success('Caja abierta')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo abrir la caja')
    }
  }

  const handleClose = async () => {
    if (!openSession) return
    try {
      await post('/api/admin/cash/close', {
        sessionId: openSession.id,
        closingAmount: Number(closingAmount),
        notes: closeNotes || undefined,
      })
      toast.success('Caja cerrada')
      setClosingAmount('')
      setCloseNotes('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la caja')
    }
  }

  const handleMovement = async () => {
    if (!openSession) return
    try {
      await post('/api/admin/cash/movements', {
        sessionId: openSession.id,
        type: movement.type,
        amount: Number(movement.amount),
        description: movement.description,
      })
      toast.success('Movimiento registrado')
      setMovement({ type: 'expense', amount: '', description: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el movimiento')
    }
  }

  const renderForm = () => {
    switch (formMode) {
      case 'open':
        return (
          <>
            <Field label="Monto inicial">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
              />
            </Field>
            <Button className={cn('w-full', PANEL_PRIMARY_BTN)} disabled={busy} onClick={() => void handleOpen()}>
              Abrir caja
            </Button>
          </>
        )
      case 'movement':
        return (
          <>
            <Field label="Tipo">
              <Select value={movement.type} onValueChange={(value) => setMovement((c) => ({ ...c, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="withdrawal">Retiro</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Monto">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={movement.amount}
                onChange={(e) => setMovement((c) => ({ ...c, amount: e.target.value }))}
              />
            </Field>
            <Field label="Descripción">
              <Input
                value={movement.description}
                onChange={(e) => setMovement((c) => ({ ...c, description: e.target.value }))}
              />
            </Field>
            <Button className={cn('w-full', PANEL_PRIMARY_BTN)} disabled={busy} onClick={() => void handleMovement()}>
              Guardar movimiento
            </Button>
          </>
        )
      case 'close':
        return (
          <>
            <Field label="Monto contado">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
              />
            </Field>
            <Field label="Notas (opcional)">
              <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={2} />
            </Field>
            <Button className={cn('w-full', PANEL_OUTLINE_BTN)} disabled={busy} onClick={() => void handleClose()}>
              Cerrar turno
            </Button>
          </>
        )
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
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-5xl">
      <AdminPageHeader
        title="Caja"
        description="Apertura, movimientos y cierre de turno"
        action={
          !openSession ? (
            canOpenClose ? (
              <Button
                size="default"
                className={cn('h-11 w-full sm:h-9 sm:w-auto', PANEL_PRIMARY_BTN)}
                onClick={() => openForm('open')}
              >
                Abrir caja
              </Button>
            ) : null
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {canRegisterMovement ? (
                <Button
                  size="default"
                  variant="outline"
                  className={cn('h-11 w-full sm:h-9 sm:w-auto', PANEL_OUTLINE_BTN)}
                  onClick={() => openForm('movement')}
                >
                  Movimiento
                </Button>
              ) : null}
              {canOpenClose ? (
                <Button
                  size="default"
                  className={cn('h-11 w-full sm:h-9 sm:w-auto', PANEL_PRIMARY_BTN)}
                  onClick={() => openForm('close')}
                >
                  Cerrar caja
                </Button>
              ) : null}
            </div>
          )
        }
      />

      <div className="space-y-4">
        <AdminFormPanel panelId="cash" title={FORM_TITLES[formMode]} open={open} onOpenChange={setOpen}>
          {renderForm()}
        </AdminFormPanel>

        {openSession ? (
          <Card className={PANEL_CARD}>
            <CardHeader>
              <CardTitle className={PANEL_TITLE}>Sesión activa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Apertura: {formatPrice(num(openSession.openingAmount))}</p>
              <p>Abierta por: {openSession.openedByUser?.name ?? '—'}</p>
              <p className="text-muted-foreground">
                Desde {formatDateTimeAR(openSession.openedAt)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className={PANEL_CARD}>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No hay caja abierta. Usá &quot;Abrir caja&quot; para iniciar el turno.
            </CardContent>
          </Card>
        )}

        {openSession?.movements && openSession.movements.length > 0 ? (
          <Card className={PANEL_CARD}>
            <CardHeader>
              <CardTitle className={PANEL_TITLE}>Movimientos del turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {openSession.movements.map((entry) => (
                <div key={entry.id} className={cn(PANEL_LIST_ROW, 'flex justify-between text-sm')}>
                  <span>{entry.description}</span>
                  <span className="font-medium">{formatPrice(num(entry.amount))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className={PANEL_CARD}>
          <CardHeader>
            <CardTitle className={PANEL_TITLE}>Historial de cierres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.sessions ?? [])
              .filter((session) => session.status === 'CLOSED')
              .slice(0, 10)
              .map((session) => (
                <div key={session.id} className={cn(PANEL_LIST_ROW, 'text-sm')}>
                  <div className="flex justify-between font-medium">
                    <span>{formatDateAR(session.openedAt)}</span>
                    <span>{formatPrice(num(session.closingAmount))}</span>
                  </div>
                  {session.difference != null ? (
                    <p className="text-xs text-muted-foreground">
                      Diferencia: {formatPrice(num(session.difference))}
                    </p>
                  ) : null}
                </div>
              ))}
            {(data?.sessions ?? []).filter((session) => session.status === 'CLOSED').length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cierres registrados</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
