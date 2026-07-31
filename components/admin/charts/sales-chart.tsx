'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatPrice } from '@/lib/coty-theme'
import type { DailySales } from '@/lib/types'

const chartConfig = {
  revenue: {
    label: 'Ventas',
    color: 'var(--color-primary)',
  },
}

export function SalesChart({ data }: { data: DailySales[] }) {
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos de ventas</p>
  }

  const chartData = data.map((entry) => ({
    ...entry,
    label: format(parseISO(entry.date), isMobile ? 'dd/MM' : 'dd MMM', { locale: es }),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full sm:h-[280px]">
      <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          interval={isMobile ? 'preserveStartEnd' : 0}
          angle={isMobile ? -35 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 36 : 24}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={10} width={44} tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">Ventas</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatPrice(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 18 : 32} />
      </BarChart>
    </ChartContainer>
  )
}
