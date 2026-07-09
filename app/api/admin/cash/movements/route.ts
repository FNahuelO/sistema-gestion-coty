import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addCashMovement } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

const movementSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['expense', 'withdrawal', 'deposit']),
  amount: z.number().positive(),
  description: z.string().trim().min(1).max(200),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('cash:movement')
    const input = movementSchema.parse(await request.json())
    const movement = await addCashMovement(input.sessionId, user.id, input)
    return NextResponse.json(movement)
  } catch (error) {
    if (error instanceof Error && error.message === 'CASH_SESSION_CLOSED') {
      return NextResponse.json({ error: 'La caja no está abierta' }, { status: 409 })
    }
    return handleRouteError(error, 'POST /api/admin/cash/movements')
  }
}
