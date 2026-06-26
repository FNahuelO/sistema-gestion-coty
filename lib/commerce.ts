import { randomUUID } from 'crypto'
import {
  CashMovementType,
  CashSessionStatus,
  DeliveryAssignmentStatus,
  DiscountType,
  InvoiceStatus,
  OrderStatus,
  OrderType,
  PaymentMethod as PrismaPaymentMethod,
  ReservationStatus,
  TableCallStatus,
  type Prisma,
} from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { DeliveryAssignmentStatus as DeliveryAssignmentStatusUi, DeliveryQueueEntry } from '@/lib/types'

function dec(value: number | string | { toString(): string }) {
  return Number(value.toString())
}

// ─── Cash register ───────────────────────────────────────────────────────────

export async function getOpenCashSession() {
  return prisma.cashSession.findFirst({
    where: { status: CashSessionStatus.OPEN },
    include: { movements: true, openedByUser: { select: { id: true, name: true } } },
    orderBy: { openedAt: 'desc' },
  })
}

export async function openCashSession(openedByUserId: string, openingAmount: number) {
  const existing = await getOpenCashSession()
  if (existing) throw new Error('CASH_SESSION_OPEN')

  return prisma.cashSession.create({
    data: { openedByUserId, openingAmount, status: CashSessionStatus.OPEN },
    include: { movements: true, openedByUser: { select: { id: true, name: true } } },
  })
}

export async function addCashMovement(
  sessionId: string,
  userId: string,
  payload: { type: 'expense' | 'withdrawal' | 'deposit'; amount: number; description: string }
) {
  const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })
  if (!session || session.status !== CashSessionStatus.OPEN) throw new Error('CASH_SESSION_CLOSED')

  const typeMap = {
    expense: CashMovementType.EXPENSE,
    withdrawal: CashMovementType.WITHDRAWAL,
    deposit: CashMovementType.DEPOSIT,
  }

  return prisma.cashMovement.create({
    data: {
      sessionId,
      createdByUserId: userId,
      type: typeMap[payload.type],
      amount: payload.amount,
      description: payload.description,
    },
  })
}

export async function closeCashSession(sessionId: string, closedByUserId: string, closingAmount: number, notes?: string) {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: { movements: true },
  })
  if (!session || session.status !== CashSessionStatus.OPEN) throw new Error('CASH_SESSION_CLOSED')

  const cashOrders = await prisma.order.findMany({
    where: {
      paymentMethod: PrismaPaymentMethod.CASH,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: session.openedAt },
    },
  })

  const salesCash = cashOrders.reduce((sum, o) => sum + dec(o.total), 0)
  const deposits = session.movements
    .filter((m) => m.type === CashMovementType.DEPOSIT)
    .reduce((sum, m) => sum + dec(m.amount), 0)
  const outflows = session.movements
    .filter((m) => m.type === CashMovementType.EXPENSE || m.type === CashMovementType.WITHDRAWAL)
    .reduce((sum, m) => sum + dec(m.amount), 0)

  const expectedAmount = dec(session.openingAmount) + salesCash + deposits - outflows
  const difference = closingAmount - expectedAmount

  return prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      status: CashSessionStatus.CLOSED,
      closedByUserId,
      closedAt: new Date(),
      closingAmount,
      expectedAmount,
      difference,
      notes: notes ?? null,
    },
  })
}

export async function listCashSessions(limit = 30) {
  return prisma.cashSession.findMany({
    take: limit,
    orderBy: { openedAt: 'desc' },
    include: {
      openedByUser: { select: { id: true, name: true } },
      closedByUser: { select: { id: true, name: true } },
      movements: true,
    },
  })
}

// ─── Delivery zones ──────────────────────────────────────────────────────────

export const deliveryZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  deliveryFee: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function listDeliveryZones() {
  return prisma.deliveryZone.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
}

export async function upsertDeliveryZone(payload: z.infer<typeof deliveryZoneSchema>) {
  const input = deliveryZoneSchema.parse(payload)
  if (input.id) {
    return prisma.deliveryZone.update({
      where: { id: input.id },
      data: { name: input.name, deliveryFee: input.deliveryFee, minOrderAmount: input.minOrderAmount, active: input.active, sortOrder: input.sortOrder },
    })
  }
  return prisma.deliveryZone.create({ data: input })
}

export async function deleteDeliveryZone(id: string) {
  await prisma.deliveryZone.delete({ where: { id } })
}

// ─── Discount codes ──────────────────────────────────────────────────────────

export const discountCodeSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(32),
  type: z.enum(['percent', 'fixed']),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mercado_pago']).optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  validFrom: z.string(),
  validTo: z.string(),
  active: z.boolean().default(true),
})

export async function listDiscountCodes() {
  return prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function upsertDiscountCode(payload: z.infer<typeof discountCodeSchema>) {
  const input = discountCodeSchema.parse(payload)
  const data = {
    code: input.code.toUpperCase(),
    type: input.type === 'percent' ? DiscountType.PERCENT : DiscountType.FIXED,
    value: input.value,
    minOrderAmount: input.minOrderAmount,
    paymentMethod: input.paymentMethod ? (input.paymentMethod.toUpperCase() as PrismaPaymentMethod) : null,
    maxUses: input.maxUses ?? null,
    validFrom: new Date(input.validFrom),
    validTo: new Date(input.validTo),
    active: input.active,
  }
  if (input.id) return prisma.discountCode.update({ where: { id: input.id }, data })
  return prisma.discountCode.create({ data })
}

export async function validateDiscountCode(code: string, subtotal: number, paymentMethod?: string) {
  const record = await prisma.discountCode.findFirst({
    where: { code: code.toUpperCase(), active: true },
  })
  if (!record) throw new Error('DISCOUNT_NOT_FOUND')
  const now = new Date()
  if (record.validFrom > now || record.validTo < now) throw new Error('DISCOUNT_EXPIRED')
  if (record.maxUses && record.usedCount >= record.maxUses) throw new Error('DISCOUNT_MAX_USES')
  if (dec(record.minOrderAmount) > subtotal) throw new Error('DISCOUNT_MIN_ORDER')

  if (record.paymentMethod && paymentMethod) {
    const pm = paymentMethod.toUpperCase() as PrismaPaymentMethod
    if (record.paymentMethod !== pm) throw new Error('DISCOUNT_PAYMENT_METHOD')
  }

  const amount =
    record.type === DiscountType.PERCENT
      ? Math.min(subtotal, (subtotal * dec(record.value)) / 100)
      : Math.min(subtotal, dec(record.value))

  return { code: record.code, amount, type: record.type === DiscountType.PERCENT ? 'percent' : 'fixed' as const }
}

export async function incrementDiscountUse(code: string) {
  await prisma.discountCode.updateMany({
    where: { code: code.toUpperCase() },
    data: { usedCount: { increment: 1 } },
  })
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export async function decrementStockForOrder(items: Array<{ productId: string; quantity: number }>) {
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product?.trackStock || product.stock === null) continue
    const next = product.stock - item.quantity
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: Math.max(0, next),
        available: next > 0 ? product.available : false,
      },
    })
  }
}

export async function getLowStockProducts() {
  return prisma.product.findMany({
    where: {
      trackStock: true,
      stock: { not: null },
      deletedAt: null,
    },
    include: { category: true },
  }).then((products) =>
    products.filter((p) => p.stock !== null && p.stock <= p.lowStockThreshold)
  )
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function upsertCustomerFromOrder(phone: string, name: string, address?: string) {
  const existing = await prisma.customer.findUnique({ where: { phone } })
  const addresses: string[] = existing ? (existing.addresses as string[]) : []
  if (address && !addresses.includes(address)) addresses.unshift(address)

  if (existing) {
    return prisma.customer.update({
      where: { phone },
      data: { name, addresses, lastOrderAt: new Date(), orderCount: { increment: 1 } },
    })
  }
  return prisma.customer.create({
    data: { phone, name, addresses, lastOrderAt: new Date(), orderCount: 1 },
  })
}

export async function listCustomers() {
  return prisma.customer.findMany({ orderBy: { lastOrderAt: 'desc' }, take: 200 })
}

// ─── Table calls ─────────────────────────────────────────────────────────────

export async function createTableCall(tableId: string) {
  const table = await prisma.diningTable.findFirst({
    where: { id: tableId, active: true, deletedAt: null },
  })
  if (!table) throw new Error('TABLE_NOT_FOUND')

  const pending = await prisma.tableCall.findFirst({
    where: { tableId, status: TableCallStatus.PENDING },
  })
  if (pending) return pending

  return prisma.tableCall.create({
    data: { tableId },
    include: { table: true },
  })
}

export async function listPendingTableCalls() {
  return prisma.tableCall.findMany({
    where: { status: TableCallStatus.PENDING },
    include: { table: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function acknowledgeTableCall(id: string, userId: string) {
  return prisma.tableCall.update({
    where: { id },
    data: { status: TableCallStatus.ACKNOWLEDGED, acknowledgedAt: new Date(), acknowledgedByUserId: userId },
  })
}

export async function resolveTableCall(id: string) {
  return prisma.tableCall.update({
    where: { id },
    data: { status: TableCallStatus.RESOLVED },
  })
}

// ─── Reservations ────────────────────────────────────────────────────────────

export const reservationSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(3).max(40),
  partySize: z.number().int().positive(),
  reservedAt: z.string(),
  durationMinutes: z.number().int().positive().default(90),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).default('pending'),
  notes: z.string().trim().max(500).optional(),
  tableId: z.string().optional().nullable(),
})

const reservationStatusMap: Record<string, ReservationStatus> = {
  pending: ReservationStatus.PENDING,
  confirmed: ReservationStatus.CONFIRMED,
  cancelled: ReservationStatus.CANCELLED,
  completed: ReservationStatus.COMPLETED,
  no_show: ReservationStatus.NO_SHOW,
}

export async function listReservations(from?: Date, to?: Date) {
  return prisma.tableReservation.findMany({
    where: {
      ...(from || to
        ? {
            reservedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: { table: true },
    orderBy: { reservedAt: 'asc' },
  })
}

export async function upsertReservation(payload: z.infer<typeof reservationSchema>) {
  const input = reservationSchema.parse(payload)
  const data = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    partySize: input.partySize,
    reservedAt: new Date(input.reservedAt),
    durationMinutes: input.durationMinutes,
    status: reservationStatusMap[input.status],
    notes: input.notes ?? null,
    tableId: input.tableId ?? null,
  }
  if (input.id) return prisma.tableReservation.update({ where: { id: input.id }, data, include: { table: true } })
  return prisma.tableReservation.create({ data, include: { table: true } })
}

// ─── Delivery assignments ────────────────────────────────────────────────────

const DELIVERY_QUEUE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
]

const deliveryQueueInclude = {
  deliveryAssignment: {
    include: { runner: { select: { id: true, name: true } } },
  },
} satisfies Prisma.OrderInclude

type DeliveryQueueOrder = Prisma.OrderGetPayload<{ include: typeof deliveryQueueInclude }>

function mapAssignmentStatus(
  status?: DeliveryAssignmentStatus | null
): DeliveryAssignmentStatusUi {
  switch (status) {
    case DeliveryAssignmentStatus.ASSIGNED:
      return 'assigned'
    case DeliveryAssignmentStatus.PICKED_UP:
      return 'picked_up'
    case DeliveryAssignmentStatus.DELIVERED:
      return 'delivered'
    default:
      return 'unassigned'
  }
}

function mapOrderStatusForQueue(status: OrderStatus): DeliveryQueueEntry['orderStatus'] {
  switch (status) {
    case OrderStatus.PENDING:
      return 'pending'
    case OrderStatus.CONFIRMED:
      return 'confirmed'
    case OrderStatus.PREPARING:
      return 'preparing'
    case OrderStatus.READY:
      return 'ready'
    case OrderStatus.DELIVERED:
      return 'delivered'
    case OrderStatus.COMPLETED:
      return 'completed'
    default:
      return 'cancelled'
  }
}

export function serializeDeliveryQueueEntry(order: DeliveryQueueOrder): DeliveryQueueEntry {
  const assignment = order.deliveryAssignment
  return {
    orderId: order.id,
    assignmentStatus: mapAssignmentStatus(assignment?.status),
    orderStatus: mapOrderStatusForQueue(order.status),
    runner: assignment?.runner ?? null,
    order: {
      displayCode: order.displayCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      total: dec(order.total),
      deliveryFee: order.deliveryFee != null ? dec(order.deliveryFee) : undefined,
      createdAt: order.createdAt.toISOString(),
    },
  }
}

function deliveryQueuePriority(entry: DeliveryQueueEntry) {
  if (entry.assignmentStatus === 'picked_up') return 0
  if (entry.orderStatus === 'ready') return 1
  if (entry.orderStatus === 'preparing') return 2
  if (entry.orderStatus === 'confirmed') return 3
  return 4
}

export function sortDeliveryQueue(entries: DeliveryQueueEntry[]) {
  return [...entries].sort((a, b) => {
    const priorityDiff = deliveryQueuePriority(a) - deliveryQueuePriority(b)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime()
  })
}

export async function listDeliveryQueue() {
  const orders = await prisma.order.findMany({
    where: {
      type: OrderType.DELIVERY,
      deletedFromOperationsAt: null,
      status: { in: DELIVERY_QUEUE_ORDER_STATUSES },
      OR: [
        { deliveryAssignment: null },
        { deliveryAssignment: { status: { not: DeliveryAssignmentStatus.DELIVERED } } },
      ],
    },
    include: deliveryQueueInclude,
    orderBy: { createdAt: 'asc' },
  })

  return sortDeliveryQueue(orders.map(serializeDeliveryQueueEntry))
}

export async function getDeliveryQueueEntry(orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      type: OrderType.DELIVERY,
      deletedFromOperationsAt: null,
      status: { in: DELIVERY_QUEUE_ORDER_STATUSES },
      OR: [
        { deliveryAssignment: null },
        { deliveryAssignment: { status: { not: DeliveryAssignmentStatus.DELIVERED } } },
      ],
    },
    include: deliveryQueueInclude,
  })

  return order ? serializeDeliveryQueueEntry(order) : null
}

export async function assignOrderToRunner(orderId: string, runnerId: string, deliveryFee?: number) {
  const [order, runner] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        type: true,
        status: true,
        deliveryFee: true,
        deletedFromOperationsAt: true,
      },
    }),
    prisma.user.findFirst({
      where: { id: runnerId, role: 'STAFF', staffRole: 'RUNNER', active: true },
      select: { id: true },
    }),
  ])

  if (!order || order.deletedFromOperationsAt) throw new Error('ORDER_NOT_FOUND')
  if (order.type !== OrderType.DELIVERY) throw new Error('ORDER_NOT_DELIVERY')
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.COMPLETED) {
    throw new Error('ORDER_NOT_ASSIGNABLE')
  }
  if (!runner) throw new Error('RUNNER_NOT_FOUND')

  const existing = await prisma.deliveryAssignment.findUnique({ where: { orderId } })
  if (existing?.status === DeliveryAssignmentStatus.PICKED_UP) {
    throw new Error('ASSIGNMENT_IN_PROGRESS')
  }

  const fee = deliveryFee ?? dec(order.deliveryFee ?? 0)

  await prisma.deliveryAssignment.upsert({
    where: { orderId },
    create: { orderId, runnerId, deliveryFee: fee, status: DeliveryAssignmentStatus.ASSIGNED },
    update: { runnerId, deliveryFee: fee, status: DeliveryAssignmentStatus.ASSIGNED, assignedAt: new Date() },
  })

  const entry = await getDeliveryQueueEntry(orderId)
  if (!entry) throw new Error('ORDER_NOT_FOUND')
  return entry
}

export async function updateDeliveryAssignment(
  orderId: string,
  status: 'assigned' | 'picked_up' | 'delivered',
  userId?: string,
  restrictToRunnerId?: string
) {
  const existing = await prisma.deliveryAssignment.findUnique({ where: { orderId } })
  if (!existing) throw new Error('ASSIGNMENT_NOT_FOUND')

  if (restrictToRunnerId && existing.runnerId !== restrictToRunnerId) {
    throw new Error('FORBIDDEN')
  }

  if (status === 'picked_up' && existing.status !== DeliveryAssignmentStatus.ASSIGNED) {
    throw new Error('INVALID_ASSIGNMENT_STATUS')
  }
  if (status === 'delivered' && existing.status !== DeliveryAssignmentStatus.PICKED_UP) {
    throw new Error('INVALID_ASSIGNMENT_STATUS')
  }

  const statusMap = {
    assigned: DeliveryAssignmentStatus.ASSIGNED,
    picked_up: DeliveryAssignmentStatus.PICKED_UP,
    delivered: DeliveryAssignmentStatus.DELIVERED,
  }

  await prisma.deliveryAssignment.update({
    where: { orderId },
    data: {
      status: statusMap[status],
      ...(status === 'picked_up' ? { pickedUpAt: new Date() } : {}),
      ...(status === 'delivered' ? { deliveredAt: new Date() } : {}),
    },
  })

  if (status === 'delivered') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    })
    if (order && (order.status === OrderStatus.READY || order.status === OrderStatus.PREPARING)) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          statusHistory: {
            create: {
              status: OrderStatus.DELIVERED,
              changedByUserId: userId,
              note: 'Entregado por cadete',
            },
          },
        },
      })
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: deliveryQueueInclude,
    })
    if (!updatedOrder) throw new Error('ORDER_NOT_FOUND')
    return serializeDeliveryQueueEntry(updatedOrder)
  }

  const entry = await getDeliveryQueueEntry(orderId)
  if (!entry) throw new Error('ASSIGNMENT_NOT_FOUND')
  return entry
}

export async function listDeliveryAssignments(activeOnly = true) {
  if (activeOnly) return listDeliveryQueue()
  return prisma.deliveryAssignment.findMany({
    include: {
      runner: { select: { id: true, name: true } },
      order: { include: { items: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })
}

export async function getRunnerSettlement(runnerId: string, from: Date, to: Date) {
  const assignments = await prisma.deliveryAssignment.findMany({
    where: {
      runnerId,
      status: DeliveryAssignmentStatus.DELIVERED,
      deliveredAt: { gte: from, lte: to },
    },
    include: { order: true },
  })
  const totalTrips = assignments.length
  const totalFees = assignments.reduce((sum, a) => sum + dec(a.deliveryFee), 0)
  const totalOrders = assignments.reduce((sum, a) => sum + dec(a.order.total), 0)
  return { totalTrips, totalFees, totalOrders, assignments }
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function createInvoiceForOrder(orderId: string, customerTaxId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.invoice) return order.invoice

  const number = `FAC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`

  return prisma.invoice.create({
    data: {
      orderId,
      number,
      customerName: order.customerName,
      customerTaxId: customerTaxId ?? null,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: InvoiceStatus.ISSUED,
    },
  })
}

export async function listInvoices(limit = 100) {
  return prisma.invoice.findMany({
    take: limit,
    orderBy: { issuedAt: 'desc' },
    include: { order: { select: { displayCode: true, type: true, customerPhone: true } } },
  })
}

// ─── Kitchen orders ──────────────────────────────────────────────────────────

export async function getKitchenOrders() {
  return prisma.order.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      deletedFromOperationsAt: null,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      items: { include: { selections: true } },
      payment: true,
      diningTable: true,
      createdByUser: true,
    },
  })
}

export async function ackKitchenOrder(orderId: string, userId?: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      kitchenAckAt: new Date(),
      status: 'PREPARING',
      statusHistory: {
        create: {
          status: 'PREPARING',
          changedByUserId: userId,
          note: 'Comanda tomada por cocina',
        },
      },
    },
  })
}

export async function markKitchenOrderReady(orderId: string, userId?: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'READY',
      statusHistory: {
        create: {
          status: 'READY',
          changedByUserId: userId,
          note: 'Marcado listo por cocina',
        },
      },
    },
  })
}

// ─── Analytics date range ──────────────────────────────────────────────────────

export async function getAnalyticsForRange(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      status: { not: 'CANCELLED' },
    },
    include: { items: true },
  })

  const revenue = orders.reduce((sum, o) => sum + dec(o.total), 0)
  const byType = { delivery: 0, pickup: 0, table: 0 }
  for (const o of orders) {
    if (o.type === 'DELIVERY') byType.delivery += dec(o.total)
    if (o.type === 'PICKUP') byType.pickup += dec(o.total)
    if (o.type === 'TABLE') byType.table += dec(o.total)
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    revenue,
    orders: orders.length,
    averageTicket: orders.length ? revenue / orders.length : 0,
    salesByType: byType,
  }
}
