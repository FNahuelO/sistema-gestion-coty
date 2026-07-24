/**
 * Smoke test: pago combinado + correlativo + caja.
 * Uso: DATABASE_URL=... pnpm exec tsx scripts/smoke-pago-combinado.ts
 */
import assert from 'node:assert/strict'
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client'
import { closeCashSession, openCashSession } from '../lib/commerce'
import { prisma } from '../lib/prisma'
import {
  closeTableAndOrders,
  createOrderFromPayload,
  updateOrderPaymentMethod,
} from '../lib/server-data'

function money(value: number) {
  return Math.round(value * 100) / 100
}

function splitTotal(total: number) {
  const half = money(total / 2)
  return { half, rest: money(total - half) }
}

async function main() {
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, available: true },
    orderBy: { basePrice: 'desc' },
    select: { id: true },
  })
  assert.ok(product, 'Necesito al menos un producto en el seed')

  const table = await prisma.diningTable.findFirst({
    where: { deletedAt: null, active: true },
    select: { id: true },
  })
  assert.ok(table, 'Necesito al menos una mesa en el seed')

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@cotycafe.com' },
    select: { id: true },
  })
  assert.ok(admin, 'Falta usuario admin del seed')

  await prisma.diningTable.update({ where: { id: table.id }, data: { status: 'FREE' } })
  await prisma.tableSession.updateMany({
    where: { tableId: table.id, closedAt: null },
    data: { closedAt: new Date() },
  })

  const existing = await prisma.cashSession.findFirst({ where: { status: 'OPEN' } })
  if (existing) {
    await prisma.cashSession.update({
      where: { id: existing.id },
      data: { status: 'CLOSED', closedAt: new Date(), closedByUserId: admin.id, closingAmount: 0 },
    })
  }

  // Abrir caja ANTES de crear pedidos de esta prueba, para no mezclar órdenes viejas.
  const session = await openCashSession(admin.id, 1000)
  await new Promise((resolve) => setTimeout(resolve, 50))

  const before = await prisma.dailyOrderCounter.findFirst({ orderBy: { serviceDate: 'desc' } })
  const startNumber = before ? Number(before.lastNumber) : 0
  const item = { productId: product.id, quantity: 3, selectedOptions: [] as [] }

  const tableOrder = await createOrderFromPayload(
    {
      type: 'table',
      paymentMethod: 'cash',
      tableId: table.id,
      customerName: '',
      customerPhone: '',
      items: [item],
    },
    admin.id,
    { bypassChannelHours: true }
  )
  assert.equal(tableOrder.dailyNumber, startNumber + 1)

  const sample = await createOrderFromPayload(
    {
      type: 'pickup',
      paymentMethod: 'cash',
      customerName: 'Sample',
      customerPhone: '1199999999',
      items: [item],
    },
    admin.id,
    { bypassChannelHours: true }
  )
  assert.equal(sample.dailyNumber, startNumber + 2)
  const sampleSplit = splitTotal(sample.total)

  const delivery = await createOrderFromPayload(
    {
      type: 'delivery',
      paymentMethod: 'cash',
      customerName: 'Cliente Delivery',
      customerPhone: '1188888888',
      customerAddress: 'Av Siempre Viva 742',
      items: [item],
    },
    admin.id,
    { bypassChannelHours: true }
  )
  assert.equal(delivery.dailyNumber, startNumber + 3)
  const deliverySplit = splitTotal(delivery.total)
  const combined = await updateOrderPaymentMethod(
    delivery.id,
    'combined',
    [
      { method: 'transfer', amount: deliverySplit.half },
      { method: 'cash', amount: deliverySplit.rest },
    ],
    admin.id
  )
  assert.equal(combined.paymentMethod, 'combined')
  assert.equal(combined.paymentSplits?.length, 2)

  const pickupCombined = await createOrderFromPayload(
    {
      type: 'pickup',
      paymentMethod: 'combined',
      paymentSplits: [
        { method: 'transfer', amount: sampleSplit.half },
        { method: 'cash', amount: sampleSplit.rest },
      ],
      customerName: 'Pickup Combinado',
      customerPhone: '1177777777',
      items: [item],
    },
    admin.id,
    { bypassChannelHours: true }
  )
  assert.equal(pickupCombined.paymentMethod, 'combined')
  assert.equal(pickupCombined.status, 'pending')
  assert.equal(pickupCombined.dailyNumber, startNumber + 4)

  const tableSplit = splitTotal(tableOrder.total)
  await closeTableAndOrders(table.id, admin.id, 'combined', [
    { method: 'cash', amount: tableSplit.half },
    { method: 'transfer', amount: tableSplit.rest },
  ])
  const closedTableOrder = await prisma.order.findUnique({
    where: { id: tableOrder.id },
    include: { paymentSplits: true, payment: true },
  })
  assert.equal(closedTableOrder?.paymentMethod, PrismaPaymentMethod.COMBINED)
  assert.equal(closedTableOrder?.status, 'COMPLETED')
  assert.equal(closedTableOrder?.payment?.status, 'APPROVED')

  // sample sigue en CASH completo hasta editarlo
  await updateOrderPaymentMethod(
    sample.id,
    'combined',
    [
      { method: 'card', amount: sampleSplit.half },
      { method: 'cash', amount: sampleSplit.rest },
    ],
    admin.id
  )

  const expectedCashSales = money(
    tableSplit.half + sampleSplit.rest + deliverySplit.rest + sampleSplit.rest
  )
  const closed = await closeCashSession(session.id, admin.id, money(1000 + expectedCashSales))
  assert.equal(Number(closed.expectedAmount), money(1000 + expectedCashSales))
  assert.equal(Number(closed.difference), 0)

  let mpRejected = false
  try {
    await createOrderFromPayload(
      {
        type: 'pickup',
        paymentMethod: 'combined',
        paymentSplits: [
          { method: 'mercado_pago', amount: sampleSplit.half },
          { method: 'cash', amount: sampleSplit.rest },
        ],
        customerName: 'MP Comb',
        customerPhone: '1166666666',
        items: [item],
      },
      admin.id,
      { bypassChannelHours: true }
    )
  } catch (error) {
    mpRejected =
      error instanceof Error &&
      (error.message === 'COMBINED_MERCADOPAGO_UNSUPPORTED' ||
        error.message === 'MERCADOPAGO_UNAVAILABLE')
  }
  assert.equal(mpRejected, true)

  console.log('SMOKE OK', {
    startNumber,
    tableNumber: tableOrder.dailyNumber,
    sampleNumber: sample.dailyNumber,
    deliveryNumber: delivery.dailyNumber,
    pickupCombinedNumber: pickupCombined.dailyNumber,
    expectedCashSales,
  })
}

main()
  .catch((error) => {
    console.error('SMOKE FAIL', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
