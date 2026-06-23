'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'
import type { HourlySales } from '@/lib/types'

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: 'var(--color-primary)',
  },
}

export function HourlySalesChart({ data }: { data: HourlySales[] }) {
  const isMobile = useIsMobile()
  const hasData = data.some((entry) => entry.revenue > 0)

  if (!hasData) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin ingresos registrados hoy</p>
  }

  const chartData = data.map((entry) => ({
    ...entry,
    label: `${String(entry.hour).padStart(2, '0')}:00`,
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full sm:h-[280px]">
      <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: isMobile ? 4 : 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={isMobile ? 9 : 10}
          interval={isMobile ? 3 : 1}
          angle={isMobile ? 0 : -45}
          textAnchor={isMobile ? 'middle' : 'end'}
          height={isMobile ? 28 : 48}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={10} width={isMobile ? 44 : 56} tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, 'Ingresos']}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 24} />
      </BarChart>
    </ChartContainer>
  )
}
