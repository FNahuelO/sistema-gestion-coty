import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePublicCatalog } from '@/lib/catalog-cache'
import { categoryInputSchema, requireSessionRole, serializeCategory, upsertCategory } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json(categories.map(serializeCategory))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/categories', error)
    return NextResponse.json({ error: 'No se pudieron cargar las categorías' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const category = await upsertCategory(null, categoryInputSchema.parse(await request.json()))
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/admin/categories', error)
    return NextResponse.json({ error: 'No se pudo crear la categoría' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const body = await request.json()
    const category = await upsertCategory(body.id, categoryInputSchema.parse(body))
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PUT /api/admin/categories', error)
    return NextResponse.json({ error: 'No se pudo actualizar la categoría' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const { id } = await request.json()
    await prisma.category.update({
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

    console.error('DELETE /api/admin/categories', error)
    return NextResponse.json({ error: 'No se pudo eliminar la categoría' }, { status: 500 })
  }
}
