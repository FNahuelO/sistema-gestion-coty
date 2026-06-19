import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateDiscountCode } from '@/lib/commerce'

const schema = z.object({
  code: z.string().trim().min(2).max(32),
  subtotal: z.number().min(0),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago']).optional(),
})

const ERROR_MESSAGES: Record<string, string> = {
  DISCOUNT_NOT_FOUND: 'Cupón no válido',
  DISCOUNT_EXPIRED: 'Cupón vencido',
  DISCOUNT_MAX_USES: 'Cupón agotado',
  DISCOUNT_MIN_ORDER: 'Monto mínimo no alcanzado',
  DISCOUNT_PAYMENT_METHOD: 'Cupón no aplica a este medio de pago',
}

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json())
    const result = await validateDiscountCode(input.code, input.subtotal, input.paymentMethod)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && ERROR_MESSAGES[error.message]) {
      return NextResponse.json({ error: ERROR_MESSAGES[error.message] }, { status: 400 })
    }
    console.error('POST /api/coupons/validate', error)
    return NextResponse.json({ error: 'No se pudo validar el cupón' }, { status: 500 })
  }
}
