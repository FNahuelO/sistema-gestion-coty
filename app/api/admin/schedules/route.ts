import { NextRequest, NextResponse } from 'next/server'
import {
  channelScheduleInputSchema,
  deleteChannelSchedule,
  getChannelSchedulesData,
  requirePermission,
  upsertChannelSchedule,
} from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('schedules:manage')
    const data = await getChannelSchedulesData()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    console.error('GET /api/admin/schedules', error)
    return NextResponse.json({ error: 'No se pudieron cargar los turnos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('schedules:manage')
    const schedule = await upsertChannelSchedule(channelScheduleInputSchema.parse(await request.json()))
    return NextResponse.json(schedule)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    console.error('POST /api/admin/schedules', error)
    return NextResponse.json({ error: 'No se pudo guardar el turno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('schedules:manage')
    const body = (await request.json()) as { id?: string }
    if (!body.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    await deleteChannelSchedule(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    console.error('DELETE /api/admin/schedules', error)
    return NextResponse.json({ error: 'No se pudo eliminar el turno' }, { status: 500 })
  }
}
