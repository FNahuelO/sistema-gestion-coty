import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ackKitchenOrder,
  assignOrderToRunner,
  getKitchenOrders,
  getRunnerSettlement,
  listDeliveryAssignments,
  markKitchenOrderReady,
  updateDeliveryAssignment,
} from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission, serializeOrder } from '@/lib/server-data'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('staff:operate')
    const view = request.nextUrl.searchParams.get('view')

    if (view === 'delivery') {
      const assignments = await listDeliveryAssignments(true)
      return NextResponse.json(assignments)
    }

    if (view === 'runners') {
      const runners = await prisma.user.findMany({
        where: { role: 'STAFF', staffRole: 'RUNNER', active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(runners)
    }

    if (view === 'settlement') {
      const runnerId = request.nextUrl.searchParams.get('runnerId')
      const from = request.nextUrl.searchParams.get('from')
      const to = request.nextUrl.searchParams.get('to')
      if (!runnerId || !from || !to) {
        return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 })
      }
      const settlement = await getRunnerSettlement(runnerId, new Date(from), new Date(to))
      return NextResponse.json(settlement)
    }

    const orders = await getKitchenOrders()
    return NextResponse.json(orders.map((order) => serializeOrder(order)))
  } catch (error) {
    return handleRouteError(error, 'GET /api/staff/operations')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('staff:operate')
    const body = z
      .object({
        action: z.enum(['assign_runner', 'ack_kitchen', 'mark_ready']),
        orderId: z.string().min(1),
        runnerId: z.string().optional(),
        deliveryFee: z.number().min(0).optional(),
      })
      .parse(await request.json())

    if (body.action === 'ack_kitchen') {
      await ackKitchenOrder(body.orderId, user.id)
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: {
          items: { include: { selections: true } },
          payment: true,
          diningTable: true,
          createdByUser: true,
        },
      })
      return NextResponse.json(order ? serializeOrder(order) : { ok: true })
    }

    if (body.action === 'mark_ready') {
      await markKitchenOrderReady(body.orderId, user.id)
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: {
          items: { include: { selections: true } },
          payment: true,
          diningTable: true,
          createdByUser: true,
        },
      })
      return NextResponse.json(order ? serializeOrder(order) : { ok: true })
    }

    if (!body.runnerId) {
      return NextResponse.json({ error: 'Cadete requerido' }, { status: 400 })
    }

    const assignment = await assignOrderToRunner(body.orderId, body.runnerId, body.deliveryFee ?? 0)
    return NextResponse.json(assignment)
  } catch (error) {
    return handleRouteError(error, 'POST /api/staff/operations')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission('staff:operate')
    const body = z
      .object({
        orderId: z.string().min(1),
        status: z.enum(['assigned', 'picked_up', 'delivered']),
      })
      .parse(await request.json())
    const assignment = await updateDeliveryAssignment(body.orderId, body.status)
    return NextResponse.json(assignment)
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/staff/operations')
  }
}
