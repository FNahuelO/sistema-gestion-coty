import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCommonRouteError } from '@/lib/api-route-errors'
import { paymentSplitsSchema } from '@/lib/payment-splits'
import { closeTableAndOrders, requireSessionRole, serializeTable } from '@/lib/server-data'

const closeSchema = z
  .object({
    paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago', 'combined']).default('cash'),
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

export async function POST(request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { tableId } = await context.params
    const body = closeSchema.parse(await request.json().catch(() => ({})))
    const table = await closeTableAndOrders(tableId, user.id, body.paymentMethod, body.paymentSplits)

    if (!table) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeTable(table))
  } catch (error) {
    const common = resolveCommonRouteError(error)
    if (common) return common

    if (error instanceof Error && error.message === 'TABLE_SESSION_NOT_FOUND') {
      return NextResponse.json(
        {
          error:
            'La mesa no tiene una sesión abierta. Ocupá la mesa o cargá un pedido antes de cobrar.',
          code: 'TABLE_SESSION_NOT_FOUND',
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'TABLE_NOT_FOUND') {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'PAYMENT_SPLITS_REQUIRED') {
      return NextResponse.json(
        { error: 'Indicá al menos dos medios con monto para el pago combinado' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'PAYMENT_SPLITS_MISMATCH') {
      return NextResponse.json(
        { error: 'La suma de los montos debe coincidir con el total a cobrar' },
        { status: 400 }
      )
    }

    console.error('POST /api/tables/[tableId]/close', error)
    return NextResponse.json({ error: 'No se pudo cerrar la mesa' }, { status: 500 })
  }
}
