import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionRole, updateOrderEstimatedMinutes } from '@/lib/server-data'

const schema = z.object({
  estimatedMinutes: z.number().int().min(1).max(600),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const body = schema.parse(await request.json())

    const order = await updateOrderEstimatedMinutes(orderId, body.estimatedMinutes)
    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PATCH /api/cashier/orders/[orderId]/estimate', error)
    return NextResponse.json({ error: 'No se pudo actualizar el tiempo estimado' }, { status: 500 })
  }
}
