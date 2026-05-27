import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOrderFromPayload, requireSessionRole } from '@/lib/server-data'

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      selectedOptions: z
        .array(
          z.object({
            optionId: z.string().min(1),
            choiceIds: z.array(z.string().min(1)).min(1),
          })
        )
        .default([]),
      notes: z.string().trim().max(500).optional(),
    })
  ),
  notes: z.string().trim().max(500).optional(),
})

export async function POST(request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'cashier', 'waitress'])
    const { tableId } = await context.params
    const body = schema.parse(await request.json())

    const order = await createOrderFromPayload(
      {
        type: 'table',
        paymentMethod: 'cash',
        customerName: 'Mesa',
        customerPhone: user.id,
        tableId,
        notes: body.notes,
        items: body.items,
      },
      user.id
    )

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/tables/[tableId]/orders', error)
    return NextResponse.json({ error: 'No se pudo crear el pedido de mesa' }, { status: 500 })
  }
}
