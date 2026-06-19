import { NextRequest, NextResponse } from 'next/server'
import { listReservations, reservationSchema, upsertReservation } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const fromParam = request.nextUrl.searchParams.get('from')
    const toParam = request.nextUrl.searchParams.get('to')
    const from = fromParam ? new Date(fromParam) : undefined
    const to = toParam ? new Date(toParam) : undefined
    const reservations = await listReservations(from, to)
    return NextResponse.json(reservations)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/reservations')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const reservation = await upsertReservation(reservationSchema.parse(await request.json()))
    return NextResponse.json(reservation)
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/reservations')
  }
}
