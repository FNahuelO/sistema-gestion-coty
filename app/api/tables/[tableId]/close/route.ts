import { NextRequest, NextResponse } from 'next/server'
import { closeTableAndOrders, requireSessionRole, serializeTable } from '@/lib/server-data'

export async function POST(_request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { tableId } = await context.params
    const table = await closeTableAndOrders(tableId, user.id)

    if (!table) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeTable(table))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/tables/[tableId]/close', error)
    return NextResponse.json({ error: 'No se pudo cerrar la mesa' }, { status: 500 })
  }
}
