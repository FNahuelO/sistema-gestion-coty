import assert from 'node:assert/strict'
import { getDailyOrderControlSummary } from '../lib/order-labels'
import type { Order } from '../lib/types'

const today = new Date()
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

const orders = [
  { dailyNumber: 1, type: 'table', status: 'completed', createdAt: today },
  { dailyNumber: 2, type: 'delivery', status: 'preparing', createdAt: today },
  { dailyNumber: 3, type: 'table', status: 'ready', createdAt: today },
  { dailyNumber: 4, type: 'pickup', status: 'confirmed', createdAt: today },
  { dailyNumber: 5, type: 'delivery', status: 'cancelled', createdAt: today },
  { dailyNumber: 99, type: 'table', status: 'completed', createdAt: yesterday },
] as Array<Pick<Order, 'dailyNumber' | 'type' | 'status' | 'createdAt'>>

const summary = getDailyOrderControlSummary(orders)

assert.equal(summary.total, 4)
assert.equal(summary.lastNumber, 4)
assert.equal(summary.table, 2)
assert.equal(summary.delivery, 1)
assert.equal(summary.pickup, 1)

console.log('daily-order-control summary OK')
