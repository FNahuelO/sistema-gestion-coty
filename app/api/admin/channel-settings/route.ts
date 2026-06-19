import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission, updateChannelSettings } from '@/lib/server-data'

const schema = z.object({
  channel: z.enum(['delivery', 'local', 'pickup']),
  enabled: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission('schedules:manage')
    const body = schema.parse(await request.json())
    const setting = await updateChannelSettings(body.channel, body.enabled)
    return NextResponse.json(setting)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    console.error('PATCH /api/admin/channel-settings', error)
    return NextResponse.json({ error: 'No se pudo actualizar el canal' }, { status: 500 })
  }
}
