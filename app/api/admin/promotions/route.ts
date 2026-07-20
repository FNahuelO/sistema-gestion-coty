import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePublicCatalog } from '@/lib/catalog-cache'
import { promotionInputSchema, requireSessionRole, serializePromotion, upsertPromotion } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const promotions = await prisma.promotion.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        validFrom: 'desc',
      },
      include: {
        products: true,
        categories: true,
      },
    })

    return NextResponse.json(promotions.map(serializePromotion))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/promotions', error)
    return NextResponse.json({ error: 'No se pudieron cargar las promociones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const promotion = await upsertPromotion(null, promotionInputSchema.parse(await request.json()))
    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/admin/promotions', error)
    return NextResponse.json({ error: 'No se pudo crear la promoción' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const body = await request.json()
    const promotion = await upsertPromotion(body.id, promotionInputSchema.parse(body))
    return NextResponse.json(promotion)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PUT /api/admin/promotions', error)
    return NextResponse.json({ error: 'No se pudo actualizar la promoción' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const { id } = await request.json()
    await prisma.promotion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    })
    revalidatePublicCatalog()
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('DELETE /api/admin/promotions', error)
    return NextResponse.json({ error: 'No se pudo eliminar la promoción' }, { status: 500 })
  }
}
