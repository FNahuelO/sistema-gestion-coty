import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cartItemInputSchema, requireSessionRole, updateOrderItems } from '@/lib/server-data'

const schema = z
  .object({
    add: z.array(cartItemInputSchema).max(50).optional(),
    updates: z
      .array(
        z.object({
          orderItemId: z.string().min(1),
          quantity: z.number().int().min(1).max(99),
        })
      )
      .max(100)
      .optional(),
    remove: z.array(z.string().min(1)).max(100).optional(),
  })
  .refine(
    (data) =>
      (data.add?.length ?? 0) > 0 || (data.updates?.length ?? 0) > 0 || (data.remove?.length ?? 0) > 0,
    { message: 'Se requiere al menos un cambio de productos' }
  )

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { orderId } = await context.params
    const body = schema.parse(await request.json())

    const order = await updateOrderItems(
      orderId,
      {
        add: body.add,
        updates: body.updates,
        remove: body.remove,
      },
      user.id
    )

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_EDITABLE') {
      return NextResponse.json(
        { error: 'Este pedido ya no se puede editar' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'ORDER_MUST_HAVE_ITEMS') {
      return NextResponse.json(
        { error: 'El pedido debe quedar con al menos un producto' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'No hay stock suficiente' }, { status: 400 })
    }

    if (
      error instanceof Error &&
      ['INVALID_PRODUCTS', 'INVALID_PRODUCT', 'INVALID_OPTION', 'INVALID_CHOICE', 'REQUIRED_OPTION', 'INVALID_OPTION_SELECTION', 'ORDER_ITEM_NOT_FOUND', 'INVALID_QUANTITY', 'NO_ITEM_CHANGES'].includes(
        error.message
      )
    ) {
      return NextResponse.json({ error: 'No se pudieron actualizar los productos' }, { status: 400 })
    }

    console.error('PATCH /api/cashier/orders/[orderId]/items', error)
    return NextResponse.json({ error: 'No se pudo editar el pedido' }, { status: 500 })
  }
}
