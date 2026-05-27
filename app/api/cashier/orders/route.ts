import { NextResponse } from 'next/server'
import { getOperationalOrders, requireSessionRole } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin', 'cashier'])
    const orders = await getOperationalOrders()
    return NextResponse.json(orders)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/cashier/orders', error)
    return NextResponse.json({ error: 'No se pudieron cargar los pedidos de caja' }, { status: 500 })
  }
}
