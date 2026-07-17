import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOrderFromPayload, requireSessionRole } from '@/lib/server-data'
import { handleOrderRouteError } from '@/lib/order-route-errors'

const staffManualOrderSchema = z.object({
  type: z.enum(['delivery', 'pickup']),
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  customerName: z.string().trim().max(120).default(''),
  customerPhone: z.string().trim().max(40).default(''),
  customerAddress: z.string().trim().max(200).optional(),
  deliveryZoneId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  /** Origen del pedido armado por caja: teléfono o cliente en el local. */
  source: z.enum(['phone', 'walk_in']).default('phone'),
  items: z
    .array(
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
    )
    .min(1),
})

function buildStaffNotes(source: 'phone' | 'walk_in', notes?: string) {
  const prefix = source === 'walk_in' ? '[Mostrador]' : '[Teléfono]'
  const trimmed = notes?.trim()
  return trimmed ? `${prefix} ${trimmed}` : prefix
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const body = staffManualOrderSchema.parse(await request.json())

    const isWalkIn = body.source === 'walk_in'
    const customerName =
      body.customerName.trim().length >= 2
        ? body.customerName.trim()
        : isWalkIn
          ? 'Cliente mostrador'
          : body.customerName.trim()
    const customerPhone =
      body.customerPhone.trim().length >= 3
        ? body.customerPhone.trim()
        : isWalkIn
          ? 'mostrador'
          : body.customerPhone.trim()

    if (body.type === 'delivery' && !body.customerAddress?.trim()) {
      return NextResponse.json({ error: 'Indicá la dirección de entrega' }, { status: 400 })
    }

    const order = await createOrderFromPayload(
      {
        type: body.type,
        paymentMethod: body.paymentMethod,
        customerName,
        customerPhone,
        customerAddress: body.type === 'delivery' ? body.customerAddress?.trim() : undefined,
        deliveryZoneId: body.type === 'delivery' ? body.deliveryZoneId : undefined,
        notes: buildStaffNotes(body.source, body.notes),
        items: body.items,
      },
      user.id,
      { bypassChannelHours: true }
    )

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return handleOrderRouteError(error, 'POST /api/staff/orders')
  }
}
