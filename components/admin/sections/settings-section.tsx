'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PANEL_ACCENT_TEXT, PANEL_CARD, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TITLE, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData, useAuth } from '@/lib/store'
import { hasPermission, type SessionRoleContext } from '@/lib/permissions'
import { ImageUploadField } from '@/components/admin/forms/image-upload-field'
import { MenuQrSection } from '@/components/admin/qr/menu-qr-section'
import { useFormPanel } from '../hooks/use-form-panel'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'
import { HistoryOrderRow } from '../ui/history-order-row'
import { MetricCard } from '../ui/metric-card'

export function SettingsSection() {
  const admin = useAdminData()
  const { user } = useAuth()
  const roleContext: SessionRoleContext = useMemo(
    () => ({
      role: user?.role === 'admin' ? 'admin' : 'staff',
      staffRole: user?.staffRole ?? null,
    }),
    [user]
  )
  const canWriteSettings = hasPermission(roleContext, 'settings:write')
  const canExportSales = hasPermission(roleContext, 'analytics:read')
  const { open, setOpen, openPanel } = useFormPanel('settings')
  const [settingsDraft, setSettingsDraft] = useState(admin.settings)

  useEffect(() => {
    setSettingsDraft(admin.settings)
  }, [admin.settings])

  const saveSettings = async () => {
    if (!settingsDraft || !canWriteSettings) return
    try {
      await admin.updateSettings(settingsDraft)
      toast.success('Configuración actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la configuración')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Configuración"
        description={canWriteSettings ? 'Datos del negocio y operación' : 'Vista de solo lectura'}
        onNew={canWriteSettings ? () => openPanel() : undefined}
        newLabel="Editar"
      />
      <div className="space-y-6">
        {canWriteSettings ? (
        <AdminFormPanel
          panelId="settings"
          title="Datos del negocio"
          open={open}
          onOpenChange={setOpen}
        >
          <Field label="Nombre"><Input value={settingsDraft?.name ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, name: event.target.value } : previous)} /></Field>
          <Field label="Logo">
            <ImageUploadField
              folder="settings"
              value={settingsDraft?.logo ?? ''}
              onChange={(url) => setSettingsDraft((previous) => previous ? { ...previous, logo: url } : previous)}
            />
          </Field>
          <Field label="Teléfono"><Input value={settingsDraft?.phone ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, phone: event.target.value } : previous)} /></Field>
          <Field label="Dirección"><Textarea value={settingsDraft?.address ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, address: event.target.value } : previous)} /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Hora apertura"><Input value={settingsDraft?.openTime ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, openTime: event.target.value } : previous)} /></Field>
            <Field label="Hora cierre"><Input value={settingsDraft?.closeTime ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, closeTime: event.target.value } : previous)} /></Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Delivery fee"><Input type="number" value={settingsDraft?.deliveryFee ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, deliveryFee: Number(event.target.value) } : previous)} /></Field>
            <Field label="Pedido mínimo"><Input type="number" value={settingsDraft?.minOrderAmount ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, minOrderAmount: Number(event.target.value) } : previous)} /></Field>
          </div>
          <Field label="Tasa impositiva"><Input type="number" step="0.01" value={settingsDraft?.taxRate ?? 0} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, taxRate: Number(event.target.value) } : previous)} /></Field>
          <Field label="WhatsApp"><Input value={settingsDraft?.whatsapp ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, whatsapp: event.target.value } : previous)} /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Alias / CVU para transferencias">
              <Input
                value={settingsDraft?.transferAlias ?? ''}
                onChange={(event) =>
                  setSettingsDraft((previous) =>
                    previous ? { ...previous, transferAlias: event.target.value } : previous
                  )
                }
                placeholder="ej. coty.cafe.mp"
              />
            </Field>
            <Field label="CBU (opcional)">
              <Input
                value={settingsDraft?.transferCbu ?? ''}
                onChange={(event) =>
                  setSettingsDraft((previous) =>
                    previous ? { ...previous, transferCbu: event.target.value } : previous
                  )
                }
              />
            </Field>
          </div>
          <Field label="Instagram"><Input value={settingsDraft?.instagram ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, instagram: event.target.value } : previous)} /></Field>
          <Field label="Facebook"><Input value={settingsDraft?.facebook ?? ''} onChange={(event) => setSettingsDraft((previous) => previous ? { ...previous, facebook: event.target.value } : previous)} /></Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Negocio abierto</Label>
            <Switch checked={settingsDraft?.isOpen ?? false} onCheckedChange={(checked) => setSettingsDraft((previous) => previous ? { ...previous, isOpen: checked } : previous)} />
          </div>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Mercado Pago habilitado</Label>
            <Switch
              checked={settingsDraft?.mercadoPagoEnabled ?? true}
              onCheckedChange={(checked) =>
                setSettingsDraft((previous) => (previous ? { ...previous, mercadoPagoEnabled: checked } : previous))
              }
            />
          </div>
          <Button className={cn('w-full', PANEL_PRIMARY_BTN)} onClick={() => saveSettings()}>Guardar configuración</Button>
        </AdminFormPanel>
        ) : (
          <Card className={PANEL_CARD}>
            <CardHeader><CardTitle className={PANEL_TITLE}>Datos del negocio</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Nombre:</span> {admin.settings?.name}</p>
              <p><span className="font-medium text-foreground">Teléfono:</span> {admin.settings?.phone}</p>
              <p><span className="font-medium text-foreground">Dirección:</span> {admin.settings?.address}</p>
              <p><span className="font-medium text-foreground">Horario:</span> {admin.settings?.openTime} – {admin.settings?.closeTime}</p>
              <p><span className="font-medium text-foreground">Estado:</span> {admin.settings?.isOpen ? 'Abierto' : 'Cerrado'}</p>
            </CardContent>
          </Card>
        )}

        <Card className={PANEL_CARD}>
          <CardHeader>
            <CardTitle className={PANEL_TITLE}>Códigos QR</CardTitle>
            <p className="text-xs text-muted-foreground">
              Generá y descargá los QR del menú para imprimir en mesas o mostrador.
            </p>
          </CardHeader>
          <CardContent>
            <MenuQrSection businessName={admin.settings?.name ?? 'Menú'} />
          </CardContent>
        </Card>

        {canExportSales ? (
        <Card className={PANEL_CARD}>
          <CardHeader><CardTitle className={PANEL_TITLE}>Control operativo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard title="Mesas atendidas hoy" value={String(admin.analytics?.tablesServedToday ?? 0)} icon={LayoutGrid} />
              <MetricCard title="Mesas atendidas (total)" value={String(admin.analytics?.tablesServed ?? 0)} icon={LayoutGrid} />
              <MetricCard title="Productos activos" value={String(admin.products.filter((product) => product.available).length)} icon={Package} />
            </div>
            <div className={PANEL_LIST_ROW}>
              <p className={PANEL_ACCENT_TEXT}>Pedidos recientes</p>
              <div className="mt-3 space-y-2">
                {admin.orders.slice(0, 6).map((order) => (
                  <HistoryOrderRow key={order.id} order={order} compact />
                ))}
                {admin.orders.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Sin pedidos recientes</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className={cn('flex-1', PANEL_OUTLINE_BTN)} onClick={() => { window.open(admin.exportSalesUrl('csv'), '_blank') }}>
                Exportar CSV
              </Button>
              <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => { window.open(admin.exportSalesUrl('xlsx'), '_blank') }}>
                Exportar XLSX
              </Button>
            </div>
          </CardContent>
        </Card>
        ) : null}
      </div>
    </div>
  )
}
