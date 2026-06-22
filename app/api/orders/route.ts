import { NextRequest, NextResponse } from 'next/server'
import { buildCustomerOrderResponse, createOrderFromPayload, getOperationalOrders, getSessionUser, requireSessionRole } from '@/lib/server-data'
import { handleOrderRouteError } from '@/lib/order-route-errors'

export async function GET() {
  try {
    await requireSessionRole(['admin', 'staff'])
    const orders = await getOperationalOrders()
    return NextResponse.json(orders)
  } catch (error) {
    return handleOrderRouteError(error, 'GET /api/orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionUser = await getSessionUser()
    const order = await createOrderFromPayload(body, sessionUser?.id)
    const response = sessionUser ? order : buildCustomerOrderResponse(order)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleOrderRouteError(error, 'POST /api/orders')
  }
}
