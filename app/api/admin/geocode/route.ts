import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/geocoding'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

const bodySchema = z.object({
  address: z.string().trim().min(4).max(300),
})

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const { address } = bodySchema.parse(await request.json())
    const result = await geocodeAddress(address)
    if (!result) {
      return NextResponse.json({ error: 'No se encontró la dirección' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    return handleRouteError(error, 'POST /api/admin/geocode')
  }
}
