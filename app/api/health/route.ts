import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check operativo: DB reachable + columnas/tablas críticas del schema actual.
 * Útil para detectar deploys donde el código quedó adelantado a las migraciones.
 */
export async function GET() {
  const checks: Record<string, boolean | string> = {
    database: false,
    dailyOrderCounter: false,
    orderDailyNumber: false,
    orderPriority: false,
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true

    const counter = await prisma.$queryRaw<Array<{ ok: number }>>`
      SELECT 1::int AS ok
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'DailyOrderCounter'
      LIMIT 1
    `
    checks.dailyOrderCounter = counter.length > 0

    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Order'
        AND column_name IN ('dailyNumber', 'serviceDate', 'priority')
    `
    const names = new Set(columns.map((row) => row.column_name))
    checks.orderDailyNumber = names.has('dailyNumber') && names.has('serviceDate')
    checks.orderPriority = names.has('priority')

    const ready =
      checks.database &&
      checks.dailyOrderCounter &&
      checks.orderDailyNumber &&
      checks.orderPriority

    return NextResponse.json(
      {
        ok: ready,
        status: ready ? 'ready' : 'schema_out_of_date',
        checks,
        hint: ready
          ? null
          : 'Ejecutá `pnpm db:migrate:deploy` contra la base de producción (o redesplegá para que el build aplique migraciones).',
      },
      { status: ready ? 200 : 503 }
    )
  } catch (error) {
    checks.database = false
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        checks,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    )
  }
}
