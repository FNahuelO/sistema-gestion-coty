import { NextRequest, NextResponse } from 'next/server'
import { deleteDeliveryZone, deliveryZoneSchema, listDeliveryZones, upsertDeliveryZone } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('settings:write')
    const zones = await listDeliveryZones()
    return NextResponse.json(zones)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/delivery-zones')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const zone = await upsertDeliveryZone(deliveryZoneSchema.parse(await request.json()))
    return NextResponse.json(zone)
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/delivery-zones')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const body = (await request.json()) as { id?: string }
    if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await deleteDeliveryZone(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/delivery-zones')
  }
}
