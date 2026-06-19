import { NextResponse } from 'next/server'
import { listCustomers } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('settings:write')
    const customers = await listCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/customers')
  }
}
