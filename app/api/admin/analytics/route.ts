import { NextResponse } from 'next/server'
import { getAnalytics, requireSessionRole } from '@/lib/server-data'

export async function GET() {
  try {
    await requireSessionRole(['admin'])
    const analytics = await getAnalytics()
    return NextResponse.json(analytics)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    console.error('GET /api/admin/analytics', error)
    return NextResponse.json({ error: 'No se pudieron cargar las métricas' }, { status: 500 })
  }
}
