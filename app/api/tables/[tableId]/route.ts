import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getPublicTable, requireSessionRole, occupyTable, serializeTable, upsertTable } from '@/lib/server-data'

export async function GET(_request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await context.params
    const table = await getPublicTable(tableId)

    if (!table) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error('GET /api/tables/[tableId]', error)
    return NextResponse.json({ error: 'No se pudo cargar la mesa' }, { status: 500 })
  }
}

const patchSchema = z.object({
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['free', 'occupied', 'waiting', 'finished']).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const user = await requireSessionRole(['admin', 'staff'])
    const { tableId } = await context.params
    const body = patchSchema.parse(await request.json())

    const existing = await prisma.diningTable.findUnique({
      where: { id: tableId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }

    if (body.status === 'occupied') {
      const table = await occupyTable(tableId, user.id)
      return NextResponse.json(table)
    }

    const table = await upsertTable(tableId, {
      number: body.number ?? existing.number,
      capacity: body.capacity ?? existing.capacity,
      status:
        body.status ??
        (existing.status === 'OCCUPIED'
          ? 'occupied'
          : existing.status === 'WAITING'
            ? 'waiting'
            : existing.status === 'FINISHED'
              ? 'finished'
              : 'free'),
      active: body.active ?? existing.active,
    })

    return NextResponse.json(table)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PATCH /api/tables/[tableId]', error)
    return NextResponse.json({ error: 'No se pudo actualizar la mesa' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    await requireSessionRole(['admin'])
    const { tableId } = await context.params

    const updated = await prisma.diningTable.update({
      where: { id: tableId },
      data: {
        active: false,
        deletedAt: new Date(),
      },
      include: {
        sessions: {
          where: {
            closedAt: null,
          },
          orderBy: {
            openedAt: 'desc',
          },
          take: 1,
          include: {
            orders: {
              orderBy: {
                createdAt: 'desc',
              },
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
            },
          },
        },
      },
    })

    return NextResponse.json(serializeTable(updated))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('DELETE /api/tables/[tableId]', error)
    return NextResponse.json({ error: 'No se pudo eliminar la mesa' }, { status: 500 })
  }
}
