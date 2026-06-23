import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPreferenceForOrder } from '@/lib/server-data'
import { resolveRequestBaseUrl } from '@/lib/request-url'

const schema = z.object({
  orderId: z.string().min(1),
  trackingProof: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())
    const baseUrl = resolveRequestBaseUrl(request)
    const order = await createPreferenceForOrder(body.orderId, baseUrl, body.trackingProof)

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de pago inválidos', code: 'INVALID_PAYLOAD' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado', code: 'ORDER_NOT_FOUND' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'INVALID_TRACKING_PROOF') {
      return NextResponse.json(
        { error: 'Prueba de seguimiento inválida', code: 'INVALID_TRACKING_PROOF' },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message === 'INVALID_PAYMENT_METHOD') {
      return NextResponse.json(
        { error: 'Este pedido no admite pago online', code: 'INVALID_PAYMENT_METHOD' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'ORDER_NOT_PAYABLE') {
      return NextResponse.json(
        { error: 'El pedido ya no está pendiente de pago', code: 'ORDER_NOT_PAYABLE' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'MERCADOPAGO_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Mercado Pago no está configurado', code: 'MERCADOPAGO_NOT_CONFIGURED' },
        { status: 500 }
      )
    }

    console.error('POST /api/payments/mercadopago/create-preference', error)
    return NextResponse.json(
      { error: 'No se pudo crear la preferencia de pago', code: 'PREFERENCE_FAILED' },
      { status: 500 }
    )
  }
}
