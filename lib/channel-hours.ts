import type { BusinessSettings } from '@/lib/types'

export type ServiceChannel = 'delivery' | 'local' | 'pickup'

export type ChannelScheduleInput = {
  id: string
  channel: ServiceChannel
  label: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  active: boolean
  sortOrder: number
}

export type ChannelSettingsInput = {
  channel: ServiceChannel
  enabled: boolean
}

const DAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export function formatDaysOfWeek(days: number[]): string {
  if (days.length === 7) return 'Lu Ma Mi Ju Vi Sa Do'
  return [...days]
    .sort((left, right) => {
      const normalize = (day: number) => (day === 0 ? 7 : day)
      return normalize(left) - normalize(right)
    })
    .map((day) => DAY_LABELS[day] ?? '?')
    .join(' ')
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + (minutes ?? 0)
}

function isWithinSchedule(startTime: string, endTime: string, currentMinutes: number): boolean {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  if (start <= end) {
    return currentMinutes >= start && currentMinutes <= end
  }

  return currentMinutes >= start || currentMinutes <= end
}

export function mapPrismaChannel(channel: string): ServiceChannel {
  switch (channel) {
    case 'DELIVERY':
      return 'delivery'
    case 'LOCAL':
      return 'local'
    default:
      return 'pickup'
  }
}

export function mapToPrismaChannel(channel: ServiceChannel): 'DELIVERY' | 'LOCAL' | 'PICKUP' {
  switch (channel) {
    case 'delivery':
      return 'DELIVERY'
    case 'local':
      return 'LOCAL'
    default:
      return 'PICKUP'
  }
}

export function mapOrderTypeToChannel(type: 'delivery' | 'pickup' | 'table'): ServiceChannel {
  switch (type) {
    case 'delivery':
      return 'delivery'
    case 'pickup':
      return 'pickup'
    default:
      return 'local'
  }
}

export function getChannelAvailability(
  channel: ServiceChannel,
  now: Date,
  settings: Pick<BusinessSettings, 'isOpen' | 'openTime' | 'closeTime' | 'timezone'>,
  channelSettings: ChannelSettingsInput[],
  schedules: ChannelScheduleInput[]
): { open: boolean; reason?: string } {
  if (!settings.isOpen) {
    return { open: false, reason: 'El negocio está cerrado' }
  }

  const channelSetting = channelSettings.find((entry) => entry.channel === channel)
  if (channelSetting && !channelSetting.enabled) {
    return { open: false, reason: `Canal ${channelLabel(channel)} desactivado` }
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone ?? 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const dayOfWeek = weekdayMap[weekday] ?? now.getDay()
  const currentMinutes = hour * 60 + minute

  const activeSchedules = schedules.filter(
    (schedule) => schedule.channel === channel && schedule.active && schedule.daysOfWeek.includes(dayOfWeek)
  )

  if (activeSchedules.length > 0) {
    const isOpen = activeSchedules.some((schedule) =>
      isWithinSchedule(schedule.startTime, schedule.endTime, currentMinutes)
    )
    return isOpen
      ? { open: true }
      : { open: false, reason: `${channelLabel(channel)} fuera de horario` }
  }

  const isOpen = isWithinSchedule(settings.openTime, settings.closeTime, currentMinutes)
  return isOpen
    ? { open: true }
    : { open: false, reason: `${channelLabel(channel)} fuera de horario` }
}

const MINUTES_PER_DAY = 1440
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

/**
 * True si `now` cae dentro del horario general o de algún horario de canal activo,
 * ampliado con márgenes antes de abrir y después de cerrar. Ignora `isOpen`
 * porque los pedidos de mesa se aceptan aunque el local figure cerrado.
 */
export function isWithinServiceWindow(
  now: Date,
  settings: Pick<BusinessSettings, 'openTime' | 'closeTime' | 'timezone'>,
  schedules: Array<Pick<ChannelScheduleInput, 'startTime' | 'endTime' | 'daysOfWeek' | 'active'>>,
  marginBeforeMinutes: number,
  marginAfterMinutes: number
): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone ?? 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })
  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
  const nowInWeek = (dayOfWeek < 0 ? now.getDay() : dayOfWeek) * MINUTES_PER_DAY + hour * 60 + minute

  const ranges = [
    { startTime: settings.openTime, endTime: settings.closeTime, daysOfWeek: ALL_DAYS },
    ...schedules.filter((schedule) => schedule.active),
  ]
    .map(({ startTime, endTime, daysOfWeek }) => ({
      start: parseTimeToMinutes(startTime ?? ''),
      end: parseTimeToMinutes(endTime ?? ''),
      daysOfWeek,
    }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end))

  if (ranges.length === 0) return true

  return ranges.some(({ start, end: rawEnd, daysOfWeek }) => {
    const end = rawEnd < start ? rawEnd + MINUTES_PER_DAY : rawEnd

    return daysOfWeek.some((day) => {
      const from = day * MINUTES_PER_DAY + start - marginBeforeMinutes
      const to = day * MINUTES_PER_DAY + end + marginAfterMinutes
      return [nowInWeek - MINUTES_PER_WEEK, nowInWeek, nowInWeek + MINUTES_PER_WEEK].some(
        (candidate) => candidate >= from && candidate <= to
      )
    })
  })
}

function channelLabel(channel: ServiceChannel): string {
  switch (channel) {
    case 'delivery':
      return 'Delivery'
    case 'local':
      return 'Local'
    default:
      return 'Retiro'
  }
}

export { channelLabel }
