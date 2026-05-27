import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPreferenceForOrder } from '@/lib/server-data'

const schema = z.object({
  orderId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())
    const { origin } = new URL(request.url)
    const order = await createPreferenceForOrder(body.orderId, origin)

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'MERCADOPAGO_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Mercado Pago no está configurado' }, { status: 500 })
    }

    console.error('POST /api/payments/mercadopago/create-preference', error)
    return NextResponse.json({ error: 'No se pudo crear la preferencia de pago' }, { status: 500 })
  }
}
