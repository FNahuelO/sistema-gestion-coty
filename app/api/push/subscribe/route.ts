import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isPushConfigured, savePushSubscription } from '@/lib/push-notifications'

const schema = z.object({
  orderId: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json({ error: 'Notificaciones no disponibles' }, { status: 503 })
    }

    const body = schema.parse(await request.json())
    await savePushSubscription(body.orderId, body.subscription)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos de suscripción inválidos' }, { status: 400 })
    }

    console.error('POST /api/push/subscribe', error)
    return NextResponse.json({ error: 'No se pudo registrar la notificación' }, { status: 500 })
  }
}
