import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeSettings } from '@/lib/server-data'

export async function GET() {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeSettings(settings))
  } catch (error) {
    console.error('GET /api/settings', error)
    return NextResponse.json({ error: 'No se pudo cargar la configuración' }, { status: 500 })
  }
}
