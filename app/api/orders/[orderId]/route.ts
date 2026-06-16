import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionRole, serializeOrder } from '@/lib/server-data'

export async function GET(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            selections: true,
          },
        },
        payment: true,
        diningTable: true,
        createdByUser: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(serializeOrder(order))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/orders/[orderId]', error)
    return NextResponse.json({ error: 'No se pudo obtener el pedido' }, { status: 500 })
  }
}
