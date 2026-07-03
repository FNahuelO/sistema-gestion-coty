import { arDayKey } from '@/lib/datetime'

export function percentVsYesterday(today: number, yesterday: number) {
  if (yesterday === 0) return null
  return ((today - yesterday) / yesterday) * 100
}

export function yesterdayMetrics(dailySales: { date: string; revenue: number; orders: number }[]) {
  const key = arDayKey(new Date(Date.now() - 86_400_000))
  const entry = dailySales.find((day) => day.date === key)
  return {
    revenue: entry?.revenue ?? 0,
    orders: entry?.orders ?? 0,
  }
}
