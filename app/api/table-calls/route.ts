import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  acknowledgeTableCall,
  createTableCall,
  listPendingTableCalls,
  resolveTableCall,
} from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('staff:operate')
    const calls = await listPendingTableCalls()
    return NextResponse.json(calls)
  } catch (error) {
    return handleRouteError(error, 'GET /api/table-calls')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tableId } = z.object({ tableId: z.string().min(1) }).parse(await request.json())
    const call = await createTableCall(tableId)
    return NextResponse.json(call)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'TABLE_NOT_FOUND') {
      return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
    }
    console.error('POST /api/table-calls', error)
    return NextResponse.json({ error: 'No se pudo solicitar al mozo' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission('staff:operate')
    const body = z
      .object({
        id: z.string().min(1),
        action: z.enum(['acknowledge', 'resolve']),
      })
      .parse(await request.json())

    const call =
      body.action === 'acknowledge'
        ? await acknowledgeTableCall(body.id, user.id)
        : await resolveTableCall(body.id)

    return NextResponse.json(call)
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/table-calls')
  }
}
