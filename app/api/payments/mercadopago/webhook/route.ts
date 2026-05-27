import { NextRequest, NextResponse } from 'next/server'
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

    await syncMercadoPagoPayment(paymentId, body)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('POST /api/payments/mercadopago/webhook', error)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 500 })
  }
}
