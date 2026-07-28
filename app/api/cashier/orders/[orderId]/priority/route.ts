import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionRole, updateOrderPriority } from '@/lib/server-data'

const schema = z.object({
  priority: z.boolean(),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const body = schema.parse(await request.json())

    const order = await updateOrderPriority(orderId, body.priority)
    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PATCH /api/cashier/orders/[orderId]/priority', error)
    return NextResponse.json({ error: 'No se pudo actualizar la prioridad' }, { status: 500 })
  }
}
