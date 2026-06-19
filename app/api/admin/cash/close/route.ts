import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { closeCashSession } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

const closeSchema = z.object({
  sessionId: z.string().min(1),
  closingAmount: z.number().min(0),
  notes: z.string().trim().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('cashier:close')
    const input = closeSchema.parse(await request.json())
    const session = await closeCashSession(input.sessionId, user.id, input.closingAmount, input.notes)
    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof Error && error.message === 'CASH_SESSION_CLOSED') {
      return NextResponse.json({ error: 'La caja no está abierta' }, { status: 409 })
    }
    return handleRouteError(error, 'POST /api/admin/cash/close')
  }
}
