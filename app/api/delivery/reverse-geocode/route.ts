import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { reverseGeocode } from '@/lib/geocoding'

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = bodySchema.parse(await request.json())
    const result = await reverseGeocode(lat, lng)

    if (!result) {
      return NextResponse.json({ error: 'No se pudo obtener la dirección' }, { status: 404 })
    }

    return NextResponse.json({
      lat: result.lat,
      lng: result.lng,
      displayName: result.displayName,
      approximate: Boolean(result.approximate),
      provider: result.provider ?? 'nominatim',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    console.error('POST /api/delivery/reverse-geocode', error)
    return NextResponse.json({ error: 'No se pudo obtener la dirección' }, { status: 500 })
  }
}
