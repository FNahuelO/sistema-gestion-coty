import { NextResponse } from 'next/server'
import { getStaffOpsAlerts, requirePermission } from '@/lib/server-data'
import { handleRouteError } from '@/lib/api-errors'

export async function GET() {
  try {
    await requirePermission('staff:operate')
    const alerts = await getStaffOpsAlerts()
    return NextResponse.json(alerts)
  } catch (error) {
    return handleRouteError(error, 'GET /api/staff/alerts')
  }
}
