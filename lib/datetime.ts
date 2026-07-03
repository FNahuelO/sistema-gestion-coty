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
