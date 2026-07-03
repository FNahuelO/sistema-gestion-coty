'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { BarChart3, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/coty-theme'
import { arDayEndISO, arDayKey, arDayStartISO } from '@/lib/datetime'
import { PANEL_CARD, PANEL_INPUT, PANEL_LIST_ROW, PANEL_OUTLINE_BTN, PANEL_PRIMARY_BTN, PANEL_SURFACE_ALT, PANEL_TITLE } from '@/lib/panel-theme'
import { cn } from '@/lib/utils'
import { useAdminData } from '@/lib/store'
import { HourlySalesChart } from '@/components/admin/charts/hourly-sales-chart'
import { SalesChart } from '@/components/admin/charts/sales-chart'
import { HISTORY_PAGE_SIZE } from '../constants'
import { percentVsYesterday, yesterdayMetrics } from '../utils/analytics'
import { CotyPriceBadge } from '../ui/coty-price-badge'
import { HistoryOrderRow } from '../ui/history-order-row'
import { MetricCard } from '../ui/metric-card'
import { SalesTypeRow } from '../ui/sales-type-row'

export function DashboardSection() {
  const admin = useAdminData()
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(0)
  const [rangeFrom, setRangeFrom] = useState(() => arDayKey(new Date(Date.now() - 7 * 86400000)))
  const [rangeTo, setRangeTo] = useState(() => arDayKey(new Date()))

  const today = arDayKey(new Date())

  const rangeError = useMemo(() => {
    if (!rangeFrom || !rangeTo) return 'Seleccioná ambas fechas para ver el reporte'
    if (rangeFrom > rangeTo) return "La fecha 'Desde' no puede ser posterior a 'Hasta'"
    if (rangeTo > today) return "La fecha 'Hasta' no puede ser futura"
    if (rangeFrom > today) return "La fecha 'Desde' no puede ser futura"
    return null
  }, [rangeFrom, rangeTo, today])

  const rangeKey =
    !rangeError && rangeFrom && rangeTo
      ? `/api/admin/analytics/range?from=${encodeURIComponent(arDayStartISO(rangeFrom))}&to=${encodeURIComponent(arDayEndISO(rangeTo))}`
      : null

  const { data: rangeAnalytics } = useSWR(rangeKey, async (url: string) => {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error('Error')
    return res.json() as Promise<{ revenue: number; orders: number; averageTicket: number }>
  })

  const yesterday = useMemo(
    () => yesterdayMetrics(admin.analytics?.dailySales ?? []),
    [admin.analytics?.dailySales]
  )

  const revenueComparison = useMemo(
    () => percentVsYesterday(admin.analytics?.todayRevenue ?? 0, yesterday.revenue),
    [admin.analytics?.todayRevenue, yesterday.revenue]
  )

  const ordersComparison = useMemo(
    () => percentVsYesterday(admin.analytics?.todayOrders ?? 0, yesterday.orders),
    [admin.analytics?.todayOrders, yesterday.orders]
  )

  const channelBreakdown = useMemo(() => {
    const sales = admin.analytics?.salesByTypeToday ?? { delivery: 0, pickup: 0, table: 0 }
    const total = sales.delivery + sales.pickup + sales.table
    const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0)
    return {
      delivery: { value: sales.delivery, percentage: pct(sales.delivery) },
      pickup: { value: sales.pickup, percentage: pct(sales.pickup) },
      table: { value: sales.table, percentage: pct(sales.table) },
    }
  }, [admin.analytics?.salesByTypeToday])

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    if (!query) return admin.history
    return admin.history.filter(
      (order) =>
        order.displayCode?.toLowerCase().includes(query) ||
        order.publicTrackingCode?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
    )
  }, [admin.history, historySearch])

  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE))
  const paginatedHistory = filteredHistory.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  )

  useEffect(() => {
    setHistoryPage(0)
  }, [historySearch])

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-6xl">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Reporte por período</h2>
        <Card className={PANEL_CARD}>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={rangeFrom}
                max={rangeTo || today}
                onChange={(e) => setRangeFrom(e.target.value)}
                aria-invalid={Boolean(rangeError)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={rangeTo}
                min={rangeFrom || undefined}
                max={today}
                onChange={(e) => setRangeTo(e.target.value)}
                aria-invalid={Boolean(rangeError)}
              />
            </div>
            <MetricCard title="Ingresos período" value={formatPrice(rangeAnalytics?.revenue ?? 0)} icon={DollarSign} />
            <MetricCard title="Pedidos período" value={String(rangeAnalytics?.orders ?? 0)} icon={ShoppingCart} />
          </CardContent>
          {rangeError && (
            <div className="px-4 pb-3">
              <p className="text-xs font-medium text-destructive">{rangeError}</p>
            </div>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Resumen de hoy</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Ventas de hoy"
            value={formatPrice(admin.analytics?.todayRevenue ?? 0)}
            icon={DollarSign}
            comparison={revenueComparison}
          />
          <MetricCard
            title="Pedidos de hoy"
            value={String(admin.analytics?.todayOrders ?? 0)}
            icon={ShoppingCart}
            comparison={ordersComparison}
          />
          <MetricCard
            title="Ticket promedio"
            value={formatPrice(admin.analytics?.averageTicket ?? 0)}
            icon={BarChart3}
          />
          <MetricCard
            title="Pedidos activos"
            value={String(admin.analytics?.activeOrders ?? 0)}
            icon={Package}
          />
        </div>
      </section>

      <Card className={PANEL_CARD}>
        <CardHeader>
          <CardTitle className={PANEL_TITLE}>Ingresos por hora</CardTitle>
        </CardHeader>
        <CardContent>
          <HourlySalesChart data={admin.analytics?.hourlySalesToday ?? []} />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Ingresos por canal (hoy)</h2>
        <div className="space-y-2">
          <SalesTypeRow
            label="Delivery"
            value={channelBreakdown.delivery.value}
            percentage={channelBreakdown.delivery.percentage}
            accentClass="border-b-[#E8A598]"
          />
          <SalesTypeRow
            label="Retiros"
            value={channelBreakdown.pickup.value}
            percentage={channelBreakdown.pickup.percentage}
            accentClass="border-b-[#7EB8B3]"
          />
          <SalesTypeRow
            label="Mesas"
            value={channelBreakdown.table.value}
            percentage={channelBreakdown.table.percentage}
            accentClass="border-b-[#7EB8B3]"
          />
        </div>
      </section>

      <Card className={PANEL_CARD}>
        <CardHeader>
          <CardTitle className={PANEL_TITLE}>Ventas diarias (últimos 14 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={admin.analytics?.dailySales ?? []} />
        </CardContent>
      </Card>

      <Card className={PANEL_CARD}>
        <CardHeader>
          <CardTitle className={PANEL_TITLE}>Ingresos por productos más vendidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(admin.analytics?.topProductsByRevenue ?? []).map((product) => (
            <div key={product.productId} className={cn(PANEL_LIST_ROW, 'flex items-center justify-between gap-3 text-sm')}>
              <div className="flex min-w-0 items-center gap-3">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs text-muted-foreground', PANEL_SURFACE_ALT)}>
                    —
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">{product.quantity} unidades</p>
                </div>
              </div>
              <CotyPriceBadge>{formatPrice(product.revenue)}</CotyPriceBadge>
            </div>
          ))}
          {(admin.analytics?.topProductsByRevenue ?? []).length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin datos de productos</p>
          )}
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">Historial de ventas</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar pedido..."
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              className={cn('h-9 w-full sm:w-48', PANEL_INPUT)}
            />
            <Button
              variant="outline"
              size="sm"
              className={PANEL_OUTLINE_BTN}
              onClick={() => window.open(admin.exportSalesUrl('csv'), '_blank')}
            >
              CSV
            </Button>
            <Button
              size="sm"
              className={PANEL_PRIMARY_BTN}
              onClick={() => window.open(admin.exportSalesUrl('xlsx'), '_blank')}
            >
              Excel
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {paginatedHistory.map((order) => (
            <HistoryOrderRow key={order.id} order={order} />
          ))}
          {filteredHistory.length === 0 && (
            <div className={cn(PANEL_LIST_ROW, 'py-8 text-center text-xs text-muted-foreground')}>
              {historySearch ? 'No hay pedidos que coincidan con la búsqueda' : 'No hay pedidos en el historial'}
            </div>
          )}
        </div>
        {filteredHistory.length > HISTORY_PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {filteredHistory.length} pedidos · página {historyPage + 1} de {historyPageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={PANEL_OUTLINE_BTN}
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((page) => Math.max(0, page - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={PANEL_OUTLINE_BTN}
                disabled={historyPage >= historyPageCount - 1}
                onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
