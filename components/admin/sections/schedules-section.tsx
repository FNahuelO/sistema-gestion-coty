'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PANEL_CARD, PANEL_ICON_ACTIVE, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_TOGGLE_ROW } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import type { ChannelSchedule } from '@/lib/types'
import { channelLabel, formatDaysOfWeek } from '@/lib/channel-hours'
import { AdminPageHeader } from '../ui/admin-page-header'
import { Field } from '../ui/field'

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0]

type ScheduleFormState = {
  id?: string
  channel: ChannelSchedule['channel']
  label: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  active: boolean
}

const emptyScheduleForm = (): ScheduleFormState => ({
  channel: 'delivery',
  label: '',
  startTime: '10:00',
  endTime: '16:00',
  daysOfWeek: ALL_DAYS,
  active: true,
})

export function SchedulesSection() {
  const admin = useAdminData()
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(emptyScheduleForm())
  const [editing, setEditing] = useState(false)

  const channelSettingsMap = useMemo(() => {
    const map = new Map(admin.channelSettings.map((entry) => [entry.channel, entry.enabled]))
    return {
      delivery: map.get('delivery') ?? true,
      local: map.get('local') ?? true,
      pickup: map.get('pickup') ?? true,
    }
  }, [admin.channelSettings])

  const groupedSchedules = useMemo(() => {
    return {
      delivery: admin.schedules.filter((entry) => entry.channel === 'delivery'),
      local: admin.schedules.filter((entry) => entry.channel === 'local'),
      pickup: admin.schedules.filter((entry) => entry.channel === 'pickup'),
    }
  }, [admin.schedules])

  const submitSchedule = async () => {
    try {
      await admin.saveSchedule({
        ...scheduleForm,
        sortOrder: admin.schedules.filter((entry) => entry.channel === scheduleForm.channel).length,
      })
      toast.success(scheduleForm.id ? 'Turno actualizado' : 'Turno creado')
      setScheduleForm(emptyScheduleForm())
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el turno')
    }
  }

  const loadSchedule = (schedule: ChannelSchedule) => {
    setScheduleForm({
      id: schedule.id,
      channel: schedule.channel,
      label: schedule.label,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      daysOfWeek: schedule.daysOfWeek,
      active: schedule.active,
    })
    setEditing(true)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        title="Turnos y horarios"
        description="Activá canales y configurá franjas horarias por día"
        onNew={() => {
          setScheduleForm(emptyScheduleForm())
          setEditing(true)
        }}
        newLabel="Agregar nuevo turno"
      />

      <div className={cn(PANEL_CARD, 'space-y-3 p-4')}>
        <div className={PANEL_TOGGLE_ROW}>
          <div>
            <Label>Negocio - Coty Cafe</Label>
            <p className="text-xs text-muted-foreground">{admin.settings?.isOpen ? 'Abierto' : 'Cerrado'}</p>
          </div>
          <Switch
            checked={admin.settings?.isOpen ?? false}
            onCheckedChange={(checked) =>
              void admin
                .updateSettings({ ...(admin.settings as NonNullable<typeof admin.settings>), isOpen: checked })
                .then(() => toast.success(checked ? 'Negocio abierto' : 'Negocio cerrado'))
            }
          />
        </div>
      </div>

      {(['delivery', 'local', 'pickup'] as const).map((channel) => (
        <div key={channel} className={cn(PANEL_CARD, 'space-y-3 p-4')}>
          <div className={PANEL_TOGGLE_ROW}>
            <div>
              <Label>{channelLabel(channel)}</Label>
              <p className="text-xs text-muted-foreground">
                {channelSettingsMap[channel] ? 'Abierto' : 'Cerrado'}
              </p>
            </div>
            <Switch
              checked={channelSettingsMap[channel]}
              onCheckedChange={(checked) =>
                void admin.updateChannelSetting(channel, checked).then(() => toast.success('Canal actualizado'))
              }
            />
          </div>

          <div className="space-y-2">
            {groupedSchedules[channel].map((schedule) => (
              <div key={schedule.id} className={cn(PANEL_LIST_ROW, 'flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between')}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{schedule.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    <span className={schedule.active ? PANEL_ICON_ACTIVE : 'text-muted-foreground'}>
                      {schedule.active ? 'Activo' : 'Inactivo'}
                    </span>
                    {' · '}
                    {schedule.startTime} – {schedule.endTime} hs
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDaysOfWeek(schedule.daysOfWeek)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Switch
                    checked={schedule.active}
                    onCheckedChange={(checked) =>
                      void admin.saveSchedule({ ...schedule, active: checked }).then(() => toast.success('Turno actualizado'))
                    }
                  />
                  <Button variant="outline" size="sm" className={PANEL_OUTLINE_BTN} onClick={() => loadSchedule(schedule)}>
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => admin.deleteSchedule(schedule.id).then(() => toast.success('Turno eliminado'))}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
            {groupedSchedules[channel].length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin turnos configurados. Se usa horario global ({admin.settings?.openTime} - {admin.settings?.closeTime}).</p>
            ) : null}
          </div>
        </div>
      ))}

      {editing ? (
        <div className={cn(PANEL_CARD, 'space-y-3 p-4')}>
          <p className="text-sm font-semibold">{scheduleForm.id ? 'Editar turno' : 'Nuevo turno'}</p>
          <Field label="Canal">
            <Select value={scheduleForm.channel} onValueChange={(value) => setScheduleForm((previous) => ({ ...previous, channel: value as ScheduleFormState['channel'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="pickup">Retiros</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nombre del turno">
            <Input value={scheduleForm.label} onChange={(event) => setScheduleForm((previous) => ({ ...previous, label: event.target.value }))} placeholder="Turno mañana" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Desde">
              <Input type="time" value={scheduleForm.startTime} onChange={(event) => setScheduleForm((previous) => ({ ...previous, startTime: event.target.value }))} />
            </Field>
            <Field label="Hasta">
              <Input type="time" value={scheduleForm.endTime} onChange={(event) => setScheduleForm((previous) => ({ ...previous, endTime: event.target.value }))} />
            </Field>
          </div>
          <div className={PANEL_TOGGLE_ROW}>
            <Label>Activo</Label>
            <Switch checked={scheduleForm.active} onCheckedChange={(checked) => setScheduleForm((previous) => ({ ...previous, active: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button className={PANEL_PRIMARY_BTN} onClick={() => submitSchedule()}>Guardar turno</Button>
            <Button variant="outline" className={PANEL_OUTLINE_BTN} onClick={() => { setEditing(false); setScheduleForm(emptyScheduleForm()) }}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
