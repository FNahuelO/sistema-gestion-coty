import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenCashSession, listCashSessions, openCashSession } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('cashier:close')
    const [open, sessions] = await Promise.all([getOpenCashSession(), listCashSessions()])
    return NextResponse.json({ open, sessions })
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/cash')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('cashier:close')
    const { openingAmount } = z.object({ openingAmount: z.number().min(0) }).parse(await request.json())
    const session = await openCashSession(user.id, openingAmount)
    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof Error && error.message === 'CASH_SESSION_OPEN') {
      return NextResponse.json({ error: 'Ya hay una caja abierta' }, { status: 409 })
    }
    return handleRouteError(error, 'POST /api/admin/cash')
  }
}
