/**
 * Utilidades de fecha/hora centralizadas en la zona horaria de Argentina.
 *
 * La base de datos guarda todo en UTC (estándar). Estas funciones convierten un
 * instante (Date) a la hora de Argentina de forma determinística, sin depender
 * de la zona horaria del servidor ni del dispositivo del usuario.
 */

export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/** Offset fijo de Argentina (no usa horario de verano desde 2009). */
export const AR_UTC_OFFSET = '-03:00'

type ArParts = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

type DateInput = Date | string | number

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value)
}

function getArParts(value: DateInput): ArParts {
  const date = toDate(value)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  const hour = get('hour')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // Algunos entornos devuelven '24' a la medianoche; lo normalizamos a '00'.
    hour: hour === '24' ? '00' : hour,
    minute: get('minute'),
    second: get('second'),
  }
}

/** 'dd/MM/yyyy' en hora de Argentina. */
export function formatDateAR(date: DateInput): string {
  const { day, month, year } = getArParts(date)
  return `${day}/${month}/${year}`
}

/** 'HH:mm' en hora de Argentina. */
export function formatTimeAR(date: DateInput): string {
  const { hour, minute } = getArParts(date)
  return `${hour}:${minute}`
}

/** 'dd/MM/yyyy HH:mm' en hora de Argentina. */
export function formatDateTimeAR(date: DateInput): string {
  return `${formatDateAR(date)} ${formatTimeAR(date)}`
}

/** Clave de día 'YYYY-MM-DD' según el calendario de Argentina (para agrupar). */
export function arDayKey(date: DateInput): string {
  const { year, month, day } = getArParts(date)
  return `${year}-${month}-${day}`
}

/**
 * Hora (AR) en la que termina el día operativo de pedidos.
 * Entre medianoche y esta hora, los pedidos siguen contando para el día anterior
 * (coincide con el cierre habitual de caja ~01:00).
 */
export const OPERATIONAL_DAY_CUTOFF_TIME = '01:00'

/** Normaliza HH:MM para el corte del día operativo; fallback 01:00. */
export function normalizeOperationalDayCutoffTime(value?: string | null): string {
  if (!value?.trim()) return OPERATIONAL_DAY_CUTOFF_TIME

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return OPERATIONAL_DAY_CUTOFF_TIME

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return OPERATIONAL_DAY_CUTOFF_TIME
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + (minutes ?? 0)
}

export function shiftDayKey(dayKey: string, days: number): string {
  const start = new Date(arDayStartISO(dayKey))
  start.setUTCDate(start.getUTCDate() + days)
  return arDayKey(start)
}

/**
 * Clave del día operativo de pedidos (no calendario estricto).
 * Ej.: a las 00:30 del martes sigue siendo lunes operativo si el corte es 01:00.
 */
export function operationalDayKey(
  date: DateInput,
  cutoffTime = OPERATIONAL_DAY_CUTOFF_TIME
): string {
  const calendarKey = arDayKey(date)
  const { hour, minute } = getArParts(date)
  const currentMinutes = Number(hour) * 60 + Number(minute)
  const cutoffMinutes = parseTimeToMinutes(cutoffTime)

  if (currentMinutes < cutoffMinutes) {
    return shiftDayKey(calendarKey, -1)
  }

  return calendarKey
}

/** True si dos instantes caen en el mismo día operativo de pedidos. */
export function isSameOperationalDay(
  a: DateInput,
  b: DateInput,
  cutoffTime = OPERATIONAL_DAY_CUTOFF_TIME
): boolean {
  return operationalDayKey(a, cutoffTime) === operationalDayKey(b, cutoffTime)
}

/** ISO en UTC del inicio (00:00 AR) del día operativo indicado por su clave. */
export function operationalDayStartISO(
  dayKey: string,
  cutoffTime = OPERATIONAL_DAY_CUTOFF_TIME
): string {
  void cutoffTime
  return arDayStartISO(dayKey)
}

/** ISO en UTC del fin del día operativo (justo antes del corte del día calendario siguiente). */
export function operationalDayEndISO(
  dayKey: string,
  cutoffTime = OPERATIONAL_DAY_CUTOFF_TIME
): string {
  const nextDayKey = shiftDayKey(dayKey, 1)
  const cutoffMinutes = parseTimeToMinutes(cutoffTime)
  const endMinutes = Math.max(0, cutoffMinutes - 1)
  const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0')
  const endMinute = String(endMinutes % 60).padStart(2, '0')
  return new Date(`${nextDayKey}T${endHour}:${endMinute}:59.999${AR_UTC_OFFSET}`).toISOString()
}

/** Hora del día (0-23) según Argentina (para buckets horarios). */
export function arHour(date: DateInput): number {
  return Number(getArParts(date).hour)
}

/** True si dos instantes caen en el mismo día calendario de Argentina. */
export function isSameArDay(a: DateInput, b: DateInput): boolean {
  return arDayKey(a) === arDayKey(b)
}

/** ISO en UTC del inicio (00:00) de un día 'YYYY-MM-DD' de Argentina. */
export function arDayStartISO(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00.000${AR_UTC_OFFSET}`).toISOString()
}

/** ISO en UTC del fin (23:59:59.999) de un día 'YYYY-MM-DD' de Argentina. */
export function arDayEndISO(dayKey: string): string {
  return new Date(`${dayKey}T23:59:59.999${AR_UTC_OFFSET}`).toISOString()
}
