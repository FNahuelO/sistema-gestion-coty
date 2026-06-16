'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { DailySales } from '@/lib/types'

const chartConfig = {
  revenue: {
    label: 'Ventas',
    color: '#2D5A57',
  },
}

export function SalesChart({ data }: { data: DailySales[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos de ventas</p>
  }

  const chartData = data.map((entry) => ({
    ...entry,
    label: format(parseISO(entry.date), 'dd MMM', { locale: es }),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
