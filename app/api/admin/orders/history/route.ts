import { NextResponse } from 'next/server'
import { getOrderHistory, requireSessionRole } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const orders = await getOrderHistory()
    return NextResponse.json(orders)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/orders/history', error)
    return NextResponse.json({ error: 'No se pudo cargar el historial' }, { status: 500 })
  }
}
