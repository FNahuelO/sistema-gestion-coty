import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/server-data'

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
      where: {
        type: {
          not: 'TABLE',
        },
        OR: [
          ...(query
            ? [
                { id: { contains: query, mode: 'insensitive' } as const },
                { displayCode: { contains: query, mode: 'insensitive' } as const },
                { publicTrackingCode: { contains: query, mode: 'insensitive' } as const },
              ]
            : []),
          ...(codes && codes.length > 0
            ? [{ publicTrackingCode: { in: codes } as const }, { id: { in: codes } as const }]
            : []),
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

    return NextResponse.json(orders.map(serializeOrder))
  } catch (error) {
    console.error('GET /api/orders/track', error)
    return NextResponse.json({ error: 'No se pudo consultar el estado del pedido' }, { status: 500 })
  }
}
