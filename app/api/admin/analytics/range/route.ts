import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsForRange } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('analytics:read')
    const fromParam = request.nextUrl.searchParams.get('from')
    const toParam = request.nextUrl.searchParams.get('to')
    if (!fromParam || !toParam) {
      return NextResponse.json({ error: 'from y to son requeridos' }, { status: 400 })
    }
    const analytics = await getAnalyticsForRange(new Date(fromParam), new Date(toParam))
    return NextResponse.json(analytics)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/analytics/range')
  }
}
