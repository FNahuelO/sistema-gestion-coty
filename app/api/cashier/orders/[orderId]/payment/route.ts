import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCommonRouteError } from '@/lib/api-route-errors'
import { paymentSplitsSchema } from '@/lib/payment-splits'
import { requireSessionRole, updateOrderPaymentMethod } from '@/lib/server-data'

const updatePaymentSchema = z
  .object({
    paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago', 'combined']),
    paymentSplits: paymentSplitsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'combined' && (!data.paymentSplits || data.paymentSplits.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indicá al menos dos medios con monto para el pago combinado',
        path: ['paymentSplits'],
      })
    }
  })

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const body = updatePaymentSchema.parse(await request.json())
    const order = await updateOrderPaymentMethod(orderId, body.paymentMethod, body.paymentSplits, user.id)
    return NextResponse.json(order)
  } catch (error) {
    const common = resolveCommonRouteError(error)
    if (common) return common

    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'ORDER_CANCELLED') {
      return NextResponse.json({ error: 'No se puede editar el pago de un pedido cancelado' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'PAYMENT_SPLITS_REQUIRED') {
      return NextResponse.json(
        { error: 'Indicá al menos dos medios con monto para el pago combinado' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'PAYMENT_SPLITS_MISMATCH') {
      return NextResponse.json(
        { error: 'La suma de los montos debe coincidir con el total del pedido' },
        { status: 400 }
      )
    }

    console.error('PATCH /api/cashier/orders/[orderId]/payment', error)
    return NextResponse.json({ error: 'No se pudo actualizar el pago' }, { status: 500 })
  }
}
