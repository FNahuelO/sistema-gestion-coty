import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionRole, updateOrderStatus } from '@/lib/server-data'

const schema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled']),
  note: z.string().trim().max(500).optional(),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'cashier'])
    const { orderId } = await context.params
    const body = schema.parse(await request.json())

    const order = await updateOrderStatus(orderId, body.status, user.id, body.note)
    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PATCH /api/cashier/orders/[orderId]/status', error)
    return NextResponse.json({ error: 'No se pudo actualizar el estado del pedido' }, { status: 500 })
  }
}
