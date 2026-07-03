import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionRole, updateOrderStatus } from '@/lib/server-data'

const schema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled']),
  note: z.string().trim().max(500).optional(),
  estimatedMinutes: z.number().int().min(1).max(600).optional(),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const body = schema.parse(await request.json())

    const order = await updateOrderStatus(orderId, body.status, user.id, body.note, body.estimatedMinutes)
    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'PAYMENT_NOT_APPROVED') {
      return NextResponse.json(
        { error: 'Debés aprobar el comprobante de transferencia antes de confirmar el pedido' },
        { status: 400 }
      )
    }

    console.error('PATCH /api/cashier/orders/[orderId]/status', error)
    return NextResponse.json({ error: 'No se pudo actualizar el estado del pedido' }, { status: 500 })
  }
}
