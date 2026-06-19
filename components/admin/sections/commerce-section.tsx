'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useFormPanel } from '../hooks/use-form-panel'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'
import { Spinner } from '@/components/ui/spinner'

type CommerceFormMode = 'zone' | 'coupon' | 'reservation' | 'invoice'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al cargar')
  return res.json()
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.error ?? 'Error')
  return payload
}

const emptyZoneForm = () => ({ name: '', deliveryFee: 0, minOrderAmount: 0, active: true })

const emptyCodeForm = () => ({
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: 10,
  minOrderAmount: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  active: true,
})

const emptyReservationForm = () => ({
  customerName: '',
  customerPhone: '',
  partySize: 2,
  reservedAt: '',
  notes: '',
})

const FORM_TITLES: Record<CommerceFormMode, string> = {
  zone: 'Nueva zona',
  coupon: 'Nuevo cupón',
  reservation: 'Nueva reserva',
  invoice: 'Generar comprobante',
}

const TAB_NEW_LABELS: Partial<Record<string, string>> = {
  zones: 'Nueva zona',
  coupons: 'Nuevo cupón',
  reservations: 'Nueva reserva',
  invoices: 'Generar comprobante',
}

export function CommerceSection() {
  const { open, setOpen, openPanel } = useFormPanel('commerce')
  const [tab, setTab] = useState('zones')
  const [formMode, setFormMode] = useState<CommerceFormMode>('zone')

  const zones = useSWR('/api/admin/delivery-zones', fetchJson)
  const codes = useSWR('/api/admin/discount-codes', fetchJson)
  const reservations = useSWR('/api/admin/reservations', fetchJson)
  const invoices = useSWR('/api/admin/invoices', fetchJson)
  const customers = useSWR('/api/admin/customers', fetchJson)

  const [zoneForm, setZoneForm] = useState(emptyZoneForm)
  const [codeForm, setCodeForm] = useState(emptyCodeForm)
  const [reservationForm, setReservationForm] = useState(emptyReservationForm)
  const [invoiceOrderId, setInvoiceOrderId] = useState('')

  const openForm = (mode: CommerceFormMode) => {
    setFormMode(mode)
    if (mode === 'zone') setZoneForm(emptyZoneForm())
    if (mode === 'coupon') setCodeForm(emptyCodeForm())
    if (mode === 'reservation') setReservationForm(emptyReservationForm())
    if (mode === 'invoice') setInvoiceOrderId('')
    openPanel()
  }

  const handleTabChange = (value: string) => {
    setTab(value)
    setOpen(false)
  }

  const tabToMode = useMemo<Record<string, CommerceFormMode | null>>(
    () => ({
      zones: 'zone',
      coupons: 'coupon',
      reservations: 'reservation',
      invoices: 'invoice',
      customers: null,
    }),
    []
  )

  const handleNew = () => {
    const mode = tabToMode[tab]
    if (mode) openForm(mode)
  }

  const saveZone = async () => {
    try {
      await postJson('/api/admin/delivery-zones', zoneForm)
      await zones.mutate()
      toast.success('Zona guardada')
      setZoneForm(emptyZoneForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error')
    }
  }

  const saveCode = async () => {
    try {
      await postJson('/api/admin/discount-codes', codeForm)
      await codes.mutate()
      toast.success('Cupón guardado')
      setCodeForm(emptyCodeForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error')
    }
  }

  const saveReservation = async () => {
    try {
      await postJson('/api/admin/reservations', { ...reservationForm, status: 'pending' })
      await reservations.mutate()
      toast.success('Reserva creada')
      setReservationForm(emptyReservationForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error')
    }
  }

  const createInvoice = async () => {
    try {
      await postJson('/api/admin/invoices', { orderId: invoiceOrderId })
      await invoices.mutate()
      toast.success('Comprobante generado')
      setInvoiceOrderId('')
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error')
    }
  }

  const renderForm = () => {
    switch (formMode) {
      case 'zone':
        return (
          <>
            <Field label="Nombre">
              <Input value={zoneForm.name} onChange={(e) => setZoneForm((c) => ({ ...c, name: e.target.value }))} />
            </Field>
            <Field label="Costo de envío">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={zoneForm.deliveryFee}
                onChange={(e) => setZoneForm((c) => ({ ...c, deliveryFee: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Pedido mínimo">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={zoneForm.minOrderAmount}
                onChange={(e) => setZoneForm((c) => ({ ...c, minOrderAmount: Number(e.target.value) }))}
              />
            </Field>
            <div className="flex gap-2">
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void saveZone()}>
                Guardar
              </Button>
              <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setZoneForm(emptyZoneForm())}>
                Limpiar
              </Button>
            </div>
          </>
        )
      case 'coupon':
        return (
          <>
            <Field label="Código">
              <Input
                value={codeForm.code}
                onChange={(e) => setCodeForm((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
              />
            </Field>
            <Field label="Valor">
              <Input
                type="number"
                min={0}
                value={codeForm.value}
                onChange={(e) => setCodeForm((c) => ({ ...c, value: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Válido desde">
              <Input
                type="date"
                value={codeForm.validFrom}
                onChange={(e) => setCodeForm((c) => ({ ...c, validFrom: e.target.value }))}
              />
            </Field>
            <Field label="Válido hasta">
              <Input
                type="date"
                value={codeForm.validTo}
                onChange={(e) => setCodeForm((c) => ({ ...c, validTo: e.target.value }))}
              />
            </Field>
            <div className={PANEL_TOGGLE_ROW}>
              <Label>Tipo porcentaje</Label>
              <Switch
                checked={codeForm.type === 'percent'}
                onCheckedChange={(checked) => setCodeForm((c) => ({ ...c, type: checked ? 'percent' : 'fixed' }))}
              />
            </div>
            <div className="flex gap-2">
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void saveCode()}>
                Guardar
              </Button>
              <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setCodeForm(emptyCodeForm())}>
                Limpiar
              </Button>
            </div>
          </>
        )
      case 'reservation':
        return (
          <>
            <Field label="Cliente">
              <Input
                value={reservationForm.customerName}
                onChange={(e) => setReservationForm((c) => ({ ...c, customerName: e.target.value }))}
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={reservationForm.customerPhone}
                onChange={(e) => setReservationForm((c) => ({ ...c, customerPhone: e.target.value }))}
              />
            </Field>
            <Field label="Personas">
              <Input
                type="number"
                min={1}
                value={reservationForm.partySize}
                onChange={(e) => setReservationForm((c) => ({ ...c, partySize: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Fecha y hora">
              <Input
                type="datetime-local"
                value={reservationForm.reservedAt}
                onChange={(e) => setReservationForm((c) => ({ ...c, reservedAt: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2">
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void saveReservation()}>
                Guardar
              </Button>
              <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setReservationForm(emptyReservationForm())}>
                Limpiar
              </Button>
            </div>
          </>
        )
      case 'invoice':
        return (
          <>
            <Field label="ID del pedido">
              <Input
                placeholder="Pegá el ID del pedido"
                value={invoiceOrderId}
                onChange={(e) => setInvoiceOrderId(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void createInvoice()}>
                Generar
              </Button>
              <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setInvoiceOrderId('')}>
                Limpiar
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 lg:max-w-5xl">
      <AdminPageHeader
        title="Comercio"
        description="Zonas, cupones, reservas, facturas y clientes"
        onNew={tabToMode[tab] ? handleNew : undefined}
        newLabel={TAB_NEW_LABELS[tab] ?? 'Nuevo'}
      />

      {tabToMode[tab] ? (
        <AdminFormPanel
          panelId="commerce"
          title={FORM_TITLES[formMode]}
          open={open}
          onOpenChange={setOpen}
        >
          {renderForm()}
        </AdminFormPanel>
      ) : null}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="zones">Zonas</TabsTrigger>
          <TabsTrigger value="coupons">Cupones</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-4 space-y-2">
            <Card className={PANEL_CARD}>
              <CardHeader>
                <CardTitle className={PANEL_TITLE}>Zonas de delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {zones.isLoading ? (
                  <Spinner />
                ) : (zones.data as Array<{ id: string; name: string; deliveryFee: number; minOrderAmount: number }>)?.length ? (
                  (zones.data as Array<{ id: string; name: string; deliveryFee: number; minOrderAmount: number }>).map((zone) => (
                    <div key={zone.id} className={PANEL_LIST_ROW}>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Envío {formatPrice(Number(zone.deliveryFee))} · Mínimo {formatPrice(Number(zone.minOrderAmount))}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin zonas configuradas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="coupons" className="mt-4 space-y-2">
            <Card className={PANEL_CARD}>
              <CardHeader>
                <CardTitle className={PANEL_TITLE}>Cupones activos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {codes.isLoading ? (
                  <Spinner />
                ) : (codes.data as Array<{ id: string; code: string; value: number; usedCount: number }>)?.length ? (
                  (codes.data as Array<{ id: string; code: string; value: number; usedCount: number }>).map((code) => (
                    <div key={code.id} className={PANEL_LIST_ROW}>
                      <p className="font-medium">{code.code}</p>
                      <p className="text-xs text-muted-foreground">{code.usedCount} usos</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin cupones</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="reservations" className="mt-4 space-y-2">
            <Card className={PANEL_CARD}>
              <CardHeader>
                <CardTitle className={PANEL_TITLE}>Reservas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reservations.isLoading ? (
                  <Spinner />
                ) : (reservations.data as Array<{ id: string; customerName: string; reservedAt: string; partySize: number }>)?.length ? (
                  (reservations.data as Array<{ id: string; customerName: string; reservedAt: string; partySize: number }>).map((r) => (
                    <div key={r.id} className={PANEL_LIST_ROW}>
                      <p className="font-medium">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.partySize} personas · {new Date(r.reservedAt).toLocaleString('es-AR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin reservas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-2">
            <Card className={PANEL_CARD}>
              <CardHeader>
                <CardTitle className={PANEL_TITLE}>Comprobantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoices.isLoading ? (
                  <Spinner />
                ) : (invoices.data as Array<{ id: string; number: string; total: number; createdAt: string }>)?.length ? (
                  (invoices.data as Array<{ id: string; number: string; total: number; createdAt: string }>).map((inv) => (
                    <div key={inv.id} className={PANEL_LIST_ROW}>
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(Number(inv.total))}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin comprobantes</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-2">
            <Card className={PANEL_CARD}>
              <CardHeader>
                <CardTitle className={PANEL_TITLE}>Clientes recurrentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customers.isLoading ? (
                  <Spinner />
                ) : (customers.data as Array<{ id: string; name: string; phone: string; orderCount: number; totalSpent: number }>)?.length ? (
                  (customers.data as Array<{ id: string; name: string; phone: string; orderCount: number; totalSpent: number }>).map((c) => (
                    <div key={c.id} className={PANEL_LIST_ROW}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.phone} · {c.orderCount} pedidos · {formatPrice(Number(c.totalSpent))}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin clientes registrados</p>
                )}
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
