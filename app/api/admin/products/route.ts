import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePublicCatalog } from '@/lib/catalog-cache'
import { productInputSchema, requireSessionRole, serializeProduct, upsertProduct } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        options: {
          include: {
            choices: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    return NextResponse.json(products.map(serializeProduct))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/products', error)
    return NextResponse.json({ error: 'No se pudieron cargar los productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const product = await upsertProduct(null, productInputSchema.parse(await request.json()))
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('POST /api/admin/products', error)
    return NextResponse.json({ error: 'No se pudo crear el producto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const body = await request.json()
    const product = await upsertProduct(body.id, productInputSchema.parse(body))
    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PUT /api/admin/products', error)
    return NextResponse.json({ error: 'No se pudo actualizar el producto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionRole(['admin'])
    const { id } = await request.json()

    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        available: false,
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

    console.error('DELETE /api/admin/products', error)
    return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 500 })
  }
}
