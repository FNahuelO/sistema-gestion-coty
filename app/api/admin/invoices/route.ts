import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createInvoiceForOrder, listInvoices } from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission } from '@/lib/server-data'

export async function GET() {
  try {
    await requirePermission('settings:write')
    const invoices = await listInvoices()
    return NextResponse.json(invoices)
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/invoices')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings:write')
    const { orderId, customerTaxId } = z
      .object({
        orderId: z.string().min(1),
        customerTaxId: z.string().trim().max(20).optional(),
      })
      .parse(await request.json())
    const invoice = await createInvoiceForOrder(orderId, customerTaxId)
    return NextResponse.json(invoice)
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/invoices')
  }
}
