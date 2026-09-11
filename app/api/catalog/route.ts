import { NextResponse } from 'next/server'
import { getPublicCatalog } from '@/lib/server-data'

export async function GET() {
  try {
    const data = await getPublicCatalog()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('GET /api/catalog', error)
    return NextResponse.json({ error: 'No se pudo cargar el catálogo' }, { status: 500 })
  }
}
