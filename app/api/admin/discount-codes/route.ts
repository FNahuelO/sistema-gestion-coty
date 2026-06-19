import { NextRequest, NextResponse } from 'next/server'
import { discountCodeSchema, listDiscountCodes, upsertDiscountCode } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('settings:write')
    const codes = await listDiscountCodes()
    return NextResponse.json(codes)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/discount-codes')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const code = await upsertDiscountCode(discountCodeSchema.parse(await request.json()))
    return NextResponse.json(code)
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/discount-codes')
  }
}
