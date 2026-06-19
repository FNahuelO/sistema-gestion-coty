'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle,
  Coffee,
  Clock,
  CreditCard,
  Download,
  LayoutGrid,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { NativeDialog } from '@/components/ui/native-dialog'
import { formatPrice } from '@/lib/coty-theme'
import { PANEL_CARD, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { Table, TableStatus } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableQrButton, TableQrDialog } from '@/components/admin/qr/table-qr-dialog'
import { QrCodeCard } from '@/components/admin/qr/qr-code-card'
import { AdminTableOrderDialog } from '@/components/admin/forms/admin-table-order-dialog'
import { buildMenuUrl, getAppBaseUrl } from '@/lib/menu-url'
import { useFormPanel } from '../hooks/use-form-panel'
import { emptyTableForm } from '../types'
import type { TableFormState } from '../types'
import { AdminFormPanel } from '../ui/admin-form-panel'
import { AdminPageHeader } from '../ui/admin-page-header'
import { AdminResponsiveActions } from '../ui/admin-responsive-actions'
import { Field } from '../ui/field'

const tableStatusColors: Record<TableStatus, string> = {
  free: 'bg-[#7EB8B3]',
  occupied: 'bg-[#2D5A57]',
  waiting: 'bg-[#EAB308]',
  finished: 'bg-[#053E38]',
}

const tableStatusIcons: Record<TableStatus, React.ElementType> = {
  free: CheckCircle,
  occupied: Coffee,
  waiting: Clock,
  finished: CreditCard,
}

export function TablesSection() {
  const admin = useAdminData()
  const { open, setOpen, openPanel } = useFormPanel('tables')
  const [tableForm, setTableForm] = useState<TableFormState>(emptyTableForm)
  const [qrTable, setQrTable] = useState<Table | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [bulkQrOpen, setBulkQrOpen] = useState(false)
  const [deletedTables, setDeletedTables] = useState<Table[]>([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)

  const baseUrl = getAppBaseUrl()
  const businessName = admin.settings?.name ?? 'Menú'

  const loadDeletedTables = useCallback(async () => {
    setLoadingDeleted(true)
    try {
      const response = await fetch('/api/tables?includeDeleted=true', { credentials: 'include' })
      if (!response.ok) throw new Error('No se pudieron cargar las mesas eliminadas')
      const data = (await response.json()) as Table[]
      setDeletedTables(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar mesas eliminadas')
    } finally {
      setLoadingDeleted(false)
    }
  }, [])

  useEffect(() => {
    if (showDeleted) void loadDeletedTables()
  }, [showDeleted, loadDeletedTables])

  const displayedTables = showDeleted ? deletedTables : admin.tables

  const loadTable = (table: Table) => {
    setTableForm({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      active: table.active ?? true,
    })
    openPanel()
  }

  const submitTable = async () => {
    try {
      const payload = {
        number: tableForm.number,
        capacity: tableForm.capacity,
        status: tableForm.status,
        active: tableForm.active,
      }

      if (tableForm.id) {
        await admin.updateTable(tableForm.id, payload)
        toast.success('Mesa actualizada')
      } else {
        await admin.addTable(payload)
        toast.success('Mesa creada')
      }

      setTableForm(emptyTableForm())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la mesa')
    }
  }

  const handleInlineUpdate = async (table: Table, field: 'number' | 'capacity', value: number) => {
    try {
      await admin.updateTable(table.id, { [field]: value })
      toast.success('Mesa actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar')
    }
  }

  const handleRestore = async (tableId: string) => {
    try {
      await admin.restoreTable(tableId)
      toast.success('Mesa restaurada')
      await loadDeletedTables()
      await admin.refreshAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo restaurar la mesa')
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-4">
        <AdminPageHeader
          title="Mesas"
          description="Grilla del salón, QR y pedidos"
          action={
            <AdminResponsiveActions
              primary={{
                key: 'new-table',
                label: 'Nueva mesa',
                icon: <LayoutGrid className="mr-1.5 h-4 w-4" />,
                onClick: () => {
                  setTableForm(emptyTableForm())
                  openPanel()
                },
              }}
              secondary={[
                {
                  key: 'new-order',
                  label: 'Cargar nueva orden',
                  icon: <Plus className="mr-1.5 h-4 w-4" />,
                  onClick: () => setOrderDialogOpen(true),
                },
                {
                  key: 'deleted',
                  label: showDeleted ? 'Ver activas' : 'Ver mesas eliminadas',
                  icon: <Trash2 className="mr-1.5 h-4 w-4" />,
                  onClick: () => setShowDeleted((current) => !current),
                  active: showDeleted,
                },
                {
                  key: 'qr',
                  label: 'Descargar QR',
                  icon: <Download className="mr-1.5 h-4 w-4" />,
                  onClick: () => setBulkQrOpen(true),
                },
                {
                  key: 'edit-mode',
                  label: 'Modificar panel',
                  icon: <Pencil className="mr-1.5 h-4 w-4" />,
                  onClick: () => setEditMode((current) => !current),
                  active: editMode,
                },
              ]}
            />
          }
        />

        <AdminFormPanel
          panelId="tables"
          title={tableForm.id ? 'Editar mesa' : 'Nueva mesa'}
          open={open}
          onOpenChange={setOpen}
        >
          <Field label="Número">
            <Input
              type="number"
              value={tableForm.number}
              onChange={(event) => setTableForm((previous) => ({ ...previous, number: Number(event.target.value) }))}
            />
          </Field>
          <Field label="Capacidad">
            <Input
              type="number"
              value={tableForm.capacity}
              onChange={(event) => setTableForm((previous) => ({ ...previous, capacity: Number(event.target.value) }))}
            />
          </Field>
          <Field label="Estado">
            <Select
              value={tableForm.status}
              onValueChange={(value) => setTableForm((previous) => ({ ...previous, status: value as TableStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Libre</SelectItem>
                <SelectItem value="occupied">Ocupada</SelectItem>
                <SelectItem value="waiting">Esperando pedido</SelectItem>
                <SelectItem value="finished">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Activa</Label>
            <Switch
              checked={tableForm.active}
              onCheckedChange={(checked) => setTableForm((previous) => ({ ...previous, active: checked }))}
            />
          </div>
          <div className="flex gap-2">
            <Button className={cn('flex-1', PANEL_PRIMARY_BTN)} onClick={() => void submitTable()}>
              Guardar
            </Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => setTableForm(emptyTableForm())}>
              Limpiar
            </Button>
          </div>
        </AdminFormPanel>

        <div className={cn(PANEL_CARD, 'p-4')}>
          {loadingDeleted ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Cargando mesas...</p>
          ) : displayedTables.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {showDeleted ? 'No hay mesas eliminadas' : 'No hay mesas configuradas'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayedTables.map((table) => {
                const StatusIcon = tableStatusIcons[table.status]

                return (
                  <div
                    key={table.id}
                    className={cn(
                      'relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all',
                      !table.active && 'opacity-60'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full opacity-20',
                        tableStatusColors[table.status]
                      )}
                    />

                    {editMode && !showDeleted ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Número</Label>
                        <Input
                          type="number"
                          defaultValue={table.number}
                          className="h-8"
                          onBlur={(event) => {
                            const value = Number(event.target.value)
                            if (value > 0 && value !== table.number) {
                              void handleInlineUpdate(table, 'number', value)
                            }
                          }}
                        />
                        <Label className="text-xs">Capacidad</Label>
                        <Input
                          type="number"
                          defaultValue={table.capacity}
                          className="h-8"
                          onBlur={(event) => {
                            const value = Number(event.target.value)
                            if (value > 0 && value !== table.capacity) {
                              void handleInlineUpdate(table, 'capacity', value)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-2xl font-bold text-[#2D5A57]">
                            {String(table.number).padStart(2, '0')}
                          </span>
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full text-white',
                              tableStatusColors[table.status]
                            )}
                          >
                            <StatusIcon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{table.capacity} personas</p>
                        <p className="text-xs text-muted-foreground">Total: {formatPrice(table.currentTotal ?? 0)}</p>
                        <div className="mt-2">
                          <StatusBadge status={table.status} />
                        </div>
                      </>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {showDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => void handleRestore(table.id)}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Restaurar
                        </Button>
                      ) : (
                        <>
                          <TableQrButton onClick={() => setQrTable(table)} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 min-w-[44px] px-2 text-xs"
                            onClick={() => loadTable(table)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 min-w-[44px] px-2 text-xs"
                            onClick={() =>
                              void admin.deleteTable(table.id).then(() => toast.success('Mesa eliminada'))
                            }
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <TableQrDialog table={qrTable} businessName={businessName} onClose={() => setQrTable(null)} />

      <AdminTableOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        tables={admin.tables}
        products={admin.products}
        onSubmit={admin.createTableOrder}
      />

      <NativeDialog
        open={bulkQrOpen}
        onOpenChange={setBulkQrOpen}
        title="Descargar QR de mesas"
        description="Generá e imprimí el código QR de cada mesa."
        maxWidthClassName="max-w-2xl"
      >
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto sm:grid-cols-2">
          {admin.tables.map((table) => (
            <div key={table.id} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4 text-[#2D5A57]" />
                Mesa {table.number}
              </div>
              <QrCodeCard
                url={buildMenuUrl(baseUrl, { tableId: table.id })}
                title={`Menú · Mesa ${table.number}`}
                description="Descargá o imprimí este código."
                downloadFilename={`mesa-${table.number}-qr.png`}
                printLabel={`Mesa ${table.number} · ${businessName}`}
              />
            </div>
          ))}
        </div>
      </NativeDialog>
    </>
  )
}
