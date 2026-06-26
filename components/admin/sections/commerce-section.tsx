'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Crosshair, Pencil, Trash2 } from 'lucide-react'
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

type ZoneGeoType = 'RADIUS' | 'POLYGON'

type ZoneForm = {
  id?: string
  name: string
  deliveryFee: number
  minOrderAmount: number
  active: boolean
  geoType: ZoneGeoType
  centerAddress: string
  centerLat: string
  centerLng: string
  radiusKm: string
  polygonText: string
}

const emptyZoneForm = (): ZoneForm => ({
  name: '',
  deliveryFee: 0,
  minOrderAmount: 0,
  active: true,
  geoType: 'RADIUS',
  centerAddress: '',
  centerLat: '',
  centerLng: '',
  radiusKm: '3',
  polygonText: '',
})

type ZoneRow = {
  id: string
  name: string
  deliveryFee: number
  minOrderAmount: number
  active: boolean
  geoType: ZoneGeoType
  centerLat: number | null
  centerLng: number | null
  radiusKm: number | null
  polygon: Array<{ lat: number; lng: number }> | null
}

function zoneRowToForm(zone: ZoneRow): ZoneForm {
  return {
    id: zone.id,
    name: zone.name,
    deliveryFee: Number(zone.deliveryFee),
    minOrderAmount: Number(zone.minOrderAmount),
    active: zone.active,
    geoType: zone.geoType,
    centerAddress: '',
    centerLat: zone.centerLat != null ? String(zone.centerLat) : '',
    centerLng: zone.centerLng != null ? String(zone.centerLng) : '',
    radiusKm: zone.radiusKm != null ? String(zone.radiusKm) : '3',
    polygonText: zone.polygon?.length
      ? zone.polygon.map((point) => `${point.lat}, ${point.lng}`).join('\n')
      : '',
  }
}

function parsePolygonText(text: string): Array<{ lat: number; lng: number }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [lat, lng] = line.split(',').map((value) => Number(value.trim()))
      return { lat, lng }
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

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

  const geocodeCenter = async () => {
    const address = zoneForm.centerAddress.trim()
    if (address.length < 4) {
      toast.error('Escribí una dirección para buscar')
      return
    }
    try {
      const result = await postJson('/api/admin/geocode', { address })
      setZoneForm((c) => ({ ...c, centerLat: String(result.lat), centerLng: String(result.lng) }))
      toast.success('Coordenadas encontradas')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se encontró la dirección')
    }
  }

  const useMyLocationForCenter = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Tu navegador no permite geolocalización')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setZoneForm((c) => ({
          ...c,
          centerLat: String(position.coords.latitude),
          centerLng: String(position.coords.longitude),
        }))
        toast.success('Ubicación tomada del dispositivo')
      },
      () => toast.error('No se pudo obtener tu ubicación')
    )
  }

  const buildZonePayload = () => {
    const base = {
      id: zoneForm.id,
      name: zoneForm.name.trim(),
      deliveryFee: Number(zoneForm.deliveryFee),
      minOrderAmount: Number(zoneForm.minOrderAmount),
      active: zoneForm.active,
      geoType: zoneForm.geoType,
    }

    if (zoneForm.geoType === 'RADIUS') {
      const centerLat = Number(zoneForm.centerLat)
      const centerLng = Number(zoneForm.centerLng)
      const radiusKm = Number(zoneForm.radiusKm)
      if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
        throw new Error('Definí el centro de la zona (lat/lng)')
      }
      if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
        throw new Error('El radio debe ser mayor a 0')
      }
      return { ...base, centerLat, centerLng, radiusKm }
    }

    const polygon = parsePolygonText(zoneForm.polygonText)
    if (polygon.length < 3) {
      throw new Error('El polígono necesita al menos 3 puntos (lat, lng por línea)')
    }
    return { ...base, polygon }
  }

  const saveZone = async () => {
    try {
      const payload = buildZonePayload()
      await postJson('/api/admin/delivery-zones', payload)
      await zones.mutate()
      toast.success('Zona guardada')
      setZoneForm(emptyZoneForm())
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error')
    }
  }

  const editZone = (zone: ZoneRow) => {
    setFormMode('zone')
    setZoneForm(zoneRowToForm(zone))
    openPanel()
  }

  const deleteZone = async (id: string) => {
    try {
      const res = await fetch('/api/admin/delivery-zones', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('No se pudo eliminar')
      await zones.mutate()
      toast.success('Zona eliminada')
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
            <Field label="Tipo de área">
              <Select
                value={zoneForm.geoType}
                onValueChange={(value) => setZoneForm((c) => ({ ...c, geoType: value as ZoneGeoType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RADIUS">Radio (centro + distancia)</SelectItem>
                  <SelectItem value="POLYGON">Polígono (puntos)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {zoneForm.geoType === 'RADIUS' ? (
              <>
                <Field label="Buscar centro por dirección">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Av. Siempre Viva 123, Ciudad"
                      value={zoneForm.centerAddress}
                      onChange={(e) => setZoneForm((c) => ({ ...c, centerAddress: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className={PANEL_OUTLINE_BTN}
                      onClick={() => geocodeCenter()}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('w-full', PANEL_OUTLINE_BTN)}
                  onClick={useMyLocationForCenter}
                >
                  <Crosshair className="mr-2 h-4 w-4" />
                  Usar mi ubicación actual
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Latitud">
                    <Input
                      type="number"
                      step="any"
                      placeholder="-34.6037"
                      value={zoneForm.centerLat}
                      onChange={(e) => setZoneForm((c) => ({ ...c, centerLat: e.target.value }))}
                    />
                  </Field>
                  <Field label="Longitud">
                    <Input
                      type="number"
                      step="any"
                      placeholder="-58.3816"
                      value={zoneForm.centerLng}
                      onChange={(e) => setZoneForm((c) => ({ ...c, centerLng: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Radio de cobertura (km)">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={zoneForm.radiusKm}
                    onChange={(e) => setZoneForm((c) => ({ ...c, radiusKm: e.target.value }))}
                  />
                </Field>
              </>
            ) : (
              <Field label="Puntos del polígono (lat, lng — uno por línea)">
                <Textarea
                  rows={5}
                  placeholder={'-34.60, -58.38\n-34.61, -58.37\n-34.62, -58.39'}
                  value={zoneForm.polygonText}
                  onChange={(e) => setZoneForm((c) => ({ ...c, polygonText: e.target.value }))}
                />
              </Field>
            )}

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
            <div className={PANEL_TOGGLE_ROW}>
              <Label>Zona activa</Label>
              <Switch
                checked={zoneForm.active}
                onCheckedChange={(checked) => setZoneForm((c) => ({ ...c, active: checked }))}
              />
            </div>
            <div className="flex gap-2">
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => saveZone()}>
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
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => saveCode()}>
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
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => saveReservation()}>
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
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => createInvoice()}>
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
                ) : (zones.data as ZoneRow[])?.length ? (
                  (zones.data as ZoneRow[]).map((zone) => {
                    const hasGeo =
                      zone.geoType === 'RADIUS'
                        ? zone.centerLat != null && zone.centerLng != null && zone.radiusKm != null
                        : (zone.polygon?.length ?? 0) >= 3
                    return (
                      <div key={zone.id} className={cn(PANEL_LIST_ROW, 'flex items-center justify-between gap-3')}>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            {zone.name}
                            {!zone.active ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inactiva</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Envío {formatPrice(Number(zone.deliveryFee))} · Mínimo {formatPrice(Number(zone.minOrderAmount))}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {zone.geoType === 'RADIUS'
                              ? hasGeo
                                ? `Radio ${zone.radiusKm} km`
                                : 'Radio sin configurar'
                              : hasGeo
                                ? `Polígono (${zone.polygon?.length} puntos)`
                                : 'Polígono sin configurar'}
                            {!hasGeo ? ' · ⚠ no detecta ubicación' : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => editZone(zone)}
                            aria-label="Editar zona"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteZone(zone.id)}
                            aria-label="Eliminar zona"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
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
