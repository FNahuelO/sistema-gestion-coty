import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleOrderRouteError } from '@/lib/order-route-errors'
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
    const user = await requireSessionRole(['admin', 'staff'])
    const { tableId } = await context.params
    const body = schema.parse(await request.json())

    const order = await createOrderFromPayload(
      {
        type: 'table',
        paymentMethod: 'cash',
        customerName: 'Mesa',
        customerPhone: '',
        tableId,
        notes: body.notes,
        items: body.items,
      },
      user.id
    )

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return handleOrderRouteError(error, 'POST /api/tables/[tableId]/orders')
  }
}
