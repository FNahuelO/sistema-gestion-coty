import { NextRequest, NextResponse } from 'next/server'
import { getTablesSnapshot, requireSessionRole, tableInputSchema, upsertTable } from '@/lib/server-data'

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const includeDeleted = request.nextUrl.searchParams.get('includeDeleted') === 'true'

    const tables = await getTablesSnapshot({
      includeDeleted,
      activeOnly: user.role === 'staff',
    })
    return NextResponse.json(tables)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/tables', error)
    return NextResponse.json({ error: 'No se pudieron cargar las mesas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const table = await upsertTable(null, tableInputSchema.parse(await request.json()))
    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/tables', error)
    return NextResponse.json({ error: 'No se pudo crear la mesa' }, { status: 500 })
  }
}
