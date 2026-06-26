import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ackKitchenOrder,
  assignOrderToRunner,
  getDeliveryQueueEntry,
  getKitchenOrders,
  getRunnerSettlement,
  listDeliveryQueue,
  markKitchenOrderReady,
  updateDeliveryAssignment,
} from '@/lib/commerce'
import { handleRouteError } from '@/lib/api-errors'
import { requirePermission, serializeOrder } from '@/lib/server-data'
import { prisma } from '@/lib/prisma'

function mapAssignmentError(error: unknown) {
  if (!(error instanceof Error)) return null

  switch (error.message) {
    case 'ORDER_NOT_FOUND':
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    case 'ORDER_NOT_DELIVERY':
      return NextResponse.json({ error: 'El pedido no es de delivery' }, { status: 400 })
    case 'ORDER_NOT_ASSIGNABLE':
      return NextResponse.json({ error: 'El pedido no admite asignación' }, { status: 400 })
    case 'RUNNER_NOT_FOUND':
      return NextResponse.json({ error: 'Cadete no encontrado o inactivo' }, { status: 400 })
    case 'ASSIGNMENT_NOT_FOUND':
      return NextResponse.json({ error: 'La entrega no está asignada' }, { status: 404 })
    case 'ASSIGNMENT_IN_PROGRESS':
      return NextResponse.json({ error: 'No se puede cambiar el cadete con el pedido en camino' }, { status: 400 })
    case 'INVALID_ASSIGNMENT_STATUS':
      return NextResponse.json({ error: 'Transición de estado inválida' }, { status: 400 })
    default:
      return null
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission('staff:operate')
    const view = request.nextUrl.searchParams.get('view')

    if (view === 'delivery') {
      const orderId = request.nextUrl.searchParams.get('orderId')
      if (orderId) {
        const entry = await getDeliveryQueueEntry(orderId)
        return NextResponse.json(entry)
      }
      const queue = await listDeliveryQueue()
      return NextResponse.json(queue)
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

    const assignment = await assignOrderToRunner(body.orderId, body.runnerId, body.deliveryFee)
    return NextResponse.json(assignment)
  } catch (error) {
    const mapped = mapAssignmentError(error)
    if (mapped) return mapped
    return handleRouteError(error, 'POST /api/staff/operations')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission('staff:operate')
    const body = z
      .object({
        orderId: z.string().min(1),
        status: z.enum(['assigned', 'picked_up', 'delivered']),
      })
      .parse(await request.json())
    const assignment = await updateDeliveryAssignment(body.orderId, body.status, user.id)
    return NextResponse.json(assignment)
  } catch (error) {
    const mapped = mapAssignmentError(error)
    if (mapped) return mapped
    return handleRouteError(error, 'PATCH /api/staff/operations')
  }
}
