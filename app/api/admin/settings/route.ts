import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, serializeSettings, settingsInputSchema, updateSettings } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('settings:read')
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeSettings(settings))
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/settings', error)
    return NextResponse.json({ error: 'No se pudo cargar la configuración' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const settings = await updateSettings(settingsInputSchema.parse(await request.json()))
    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('PATCH /api/admin/settings', error)
    return NextResponse.json({ error: 'No se pudo actualizar la configuración' }, { status: 500 })
  }
}
