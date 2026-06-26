import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCoverageForPoint } from '@/lib/commerce'
import { geocodeAddress } from '@/lib/geocoding'

const bodySchema = z
  .object({
    address: z.string().trim().min(4).max(300).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine((data) => data.address || (data.lat != null && data.lng != null), {
    message: 'Se requiere una dirección o coordenadas',
  })

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json())

    let point: { lat: number; lng: number } | null = null
    let displayName: string | undefined

    if (body.lat != null && body.lng != null) {
      point = { lat: body.lat, lng: body.lng }
    } else if (body.address) {
      const geo = await geocodeAddress(body.address)
      if (geo) {
        point = { lat: geo.lat, lng: geo.lng }
        displayName = geo.displayName
      }
    }

    if (!point) {
      return NextResponse.json({
        covered: false,
        reason: 'NOT_FOUND',
        coordinates: null,
        zone: null,
        hasConfiguredZones: true,
      })
    }

    const { zone, hasConfiguredZones } = await resolveCoverageForPoint(point)

    if (!zone) {
      return NextResponse.json({
        covered: false,
        reason: hasConfiguredZones ? 'OUT_OF_RANGE' : 'NO_ZONES',
        coordinates: point,
        displayName,
        zone: null,
        hasConfiguredZones,
      })
    }

    return NextResponse.json({
      covered: true,
      coordinates: point,
      displayName,
      hasConfiguredZones,
      zone: {
        id: zone.id,
        name: zone.name,
        deliveryFee: zone.deliveryFee,
        minOrderAmount: zone.minOrderAmount,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    console.error('POST /api/delivery/check-coverage', error)
    return NextResponse.json({ error: 'No se pudo verificar la cobertura' }, { status: 500 })
  }
}
