import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPreferenceForOrder } from '@/lib/server-data'

const schema = z.object({
  orderId: z.string().min(1),
  trackingProof: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())
    const { origin } = new URL(request.url)
    const order = await createPreferenceForOrder(body.orderId, origin, body.trackingProof)

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos de pago inválidos' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'INVALID_TRACKING_PROOF') {
      return NextResponse.json({ error: 'Prueba de seguimiento inválida' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'INVALID_PAYMENT_METHOD') {
      return NextResponse.json({ error: 'Este pedido no admite pago online' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_PAYABLE') {
      return NextResponse.json({ error: 'El pedido ya no está pendiente de pago' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'MERCADOPAGO_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Mercado Pago no está configurado' }, { status: 500 })
    }

    console.error('POST /api/payments/mercadopago/create-preference', error)
    return NextResponse.json({ error: 'No se pudo crear la preferencia de pago' }, { status: 500 })
  }
}
