import { NextRequest, NextResponse } from 'next/server'
import { approveOrderPayment, requireSessionRole } from '@/lib/server-data'

export async function POST(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const order = await approveOrderPayment(orderId, user.id)
    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'INVALID_PAYMENT_METHOD') {
      return NextResponse.json({ error: 'Este pedido no admite aprobación por WhatsApp' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_PAYABLE') {
      return NextResponse.json({ error: 'El pedido ya no está pendiente de pago' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'PAYMENT_ALREADY_PROCESSED') {
      return NextResponse.json({ error: 'El pago ya fue procesado' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'No hay stock suficiente para confirmar el pedido' }, { status: 400 })
    }

    console.error('POST /api/cashier/orders/[orderId]/approve-payment', error)
    return NextResponse.json({ error: 'No se pudo aprobar el pago' }, { status: 500 })
  }
}
