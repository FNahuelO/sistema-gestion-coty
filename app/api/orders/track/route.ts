import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePublicTrackedOrder } from '@/lib/server-data'
import { buildWhatsAppUrl } from '@/lib/whatsapp-message'

function buildExactMatchWhere(query: string) {
  return {
    OR: [
      { id: { equals: query, mode: 'insensitive' as const } },
      { displayCode: { equals: query, mode: 'insensitive' as const } },
      { publicTrackingCode: { equals: query, mode: 'insensitive' as const } },
    ],
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim()
    const codes = searchParams
      .get('codes')
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!query && (!codes || codes.length === 0)) {
      return NextResponse.json([])
    }

    const orders = await prisma.order.findMany({
      where: query
        ? buildExactMatchWhere(query)
        : {
            OR: [
              { publicTrackingCode: { in: codes! } },
              { id: { in: codes! } },
              { displayCode: { in: codes! } },
            ],
          },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            selections: true,
          },
        },
        payment: true,
        diningTable: true,
        createdByUser: true,
      },
    })

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'main' } })

    return NextResponse.json(
      orders.map((order) => {
        const serialized = serializePublicTrackedOrder(order)
        if (
          settings &&
          serialized.status === 'pending' &&
          serialized.paymentMethod === 'transfer' &&
          serialized.paymentStatus === 'pending'
        ) {
          return {
            ...serialized,
            whatsappCheckoutUrl: buildWhatsAppUrl(settings.whatsapp, serialized, settings.name, {
              transferAlias: settings.transferAlias,
              transferCbu: settings.transferCbu,
              includePaymentInstructions: true,
            }),
          }
        }
        return serialized
      })
    )
  } catch (error) {
    console.error('GET /api/orders/track', error)
    return NextResponse.json({ error: 'No se pudo consultar el estado del pedido' }, { status: 500 })
  }
}
