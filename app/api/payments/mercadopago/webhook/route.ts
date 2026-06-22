import { NextRequest, NextResponse } from 'next/server'
import { shouldVerifyMercadoPagoWebhook, verifyMercadoPagoWebhookSignature } from '@/lib/mercadopago-webhook'
import { syncMercadoPagoPayment } from '@/lib/server-data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const paymentId =
      body?.data?.id ??
      body?.id ??
      new URL(request.url).searchParams.get('data.id') ??
      new URL(request.url).searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (shouldVerifyMercadoPagoWebhook() && webhookSecret) {
      const isValid = verifyMercadoPagoWebhookSignature({
        signatureHeader: request.headers.get('x-signature'),
        requestId: request.headers.get('x-request-id'),
        dataId: String(paymentId),
        secret: webhookSecret,
      })

      if (!isValid) {
        return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 })
      }
    }

    await syncMercadoPagoPayment(paymentId, body)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('POST /api/payments/mercadopago/webhook', error)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 500 })
  }
}
