import { NextRequest, NextResponse } from 'next/server'
import { resolveCommonRouteError } from '@/lib/api-route-errors'
import { prisma } from '@/lib/prisma'
import { closeTableAndOrders, orderDetailInclude, requireSessionRole, serializeOrder } from '@/lib/server-data'

export async function POST(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, diningTableId: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (order.diningTableId) {
      await closeTableAndOrders(order.diningTableId, user.id)
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        deletedFromOperationsAt: new Date(),
        statusHistory: {
          create: {
            status: 'COMPLETED',
            changedByUserId: user.id,
            note: 'Pedido cerrado desde caja',
          },
        },
      },
      include: orderDetailInclude,
    })

    await prisma.auditLog.create({
      data: {
        action: 'order.closed',
        entityType: 'order',
        entityId: updated.id,
        createdByUserId: user.id,
        orderId: updated.id,
        metadata: {
          deletedFromOperationsAt: updated.deletedFromOperationsAt?.toISOString() ?? null,
        },
      },
    })

    return NextResponse.json(serializeOrder(updated))
  } catch (error) {
    const common = resolveCommonRouteError(error)
    if (common) return common

    console.error('POST /api/cashier/orders/[orderId]/close', error)
    return NextResponse.json({ error: 'No se pudo cerrar el pedido' }, { status: 500 })
  }
}
