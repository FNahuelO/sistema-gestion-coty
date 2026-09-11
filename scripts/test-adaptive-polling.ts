import assert from 'node:assert/strict'
import {
  ADAPTIVE_POLLING_MAX_MS,
  STAFF_POLL_BASE_MS,
  adaptiveRefreshInterval,
  applyQuietHours,
  countActiveDeliveryEntries,
  countActiveOrders,
  countBusyTables,
  countStaffOpsAlerts,
} from '../lib/adaptive-polling'

const daytime = new Date('2026-09-11T15:00:00.000Z') // 12:00 AR
const quiet = new Date('2026-09-11T06:30:00.000Z') // 03:30 AR
const quietEnd = new Date('2026-09-11T10:00:00.000Z') // 07:00 AR — ya no es valle

const base = STAFF_POLL_BASE_MS

assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 3, isOpen: true, now: daytime }),
  base
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 2, isOpen: true, now: daytime }),
  base * 2
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 0, isOpen: true, now: daytime }),
  base * 4
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 0, now: daytime }),
  base * 4
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 0, isOpen: false, now: daytime }),
  base * 12
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: 30_000, activeCount: 0, isOpen: false, now: daytime }),
  ADAPTIVE_POLLING_MAX_MS
)
assert.equal(
  adaptiveRefreshInterval({
    baseMs: base,
    activeCount: 5,
    isOpen: true,
    isDocumentHidden: true,
    now: daytime,
  }),
  0
)
assert.equal(adaptiveRefreshInterval({ baseMs: 0, now: daytime }), 0)

assert.equal(applyQuietHours(base, daytime), base)
assert.equal(applyQuietHours(base, quiet), 120_000)
assert.equal(applyQuietHours(base, quietEnd), base)
assert.equal(applyQuietHours(80_000, quiet), ADAPTIVE_POLLING_MAX_MS)
assert.equal(applyQuietHours(0, daytime), 0)

assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 4, isOpen: true, now: quiet }),
  120_000
)
assert.equal(
  adaptiveRefreshInterval({ baseMs: base, activeCount: 0, isOpen: false, now: quiet }),
  ADAPTIVE_POLLING_MAX_MS
)

assert.equal(countActiveOrders([{ status: 'pending' }, { status: 'completed' }, { status: 'preparing' }]), 2)
assert.equal(countActiveOrders([]), 0)
assert.equal(countBusyTables([{ status: 'occupied' }, { status: 'free' }, { status: 'waiting' }]), 2)
assert.equal(
  countActiveDeliveryEntries([
    { orderStatus: 'ready', assignmentStatus: 'assigned' },
    { orderStatus: 'completed', assignmentStatus: 'delivered' },
    { orderStatus: 'cancelled', assignmentStatus: 'unassigned' },
  ]),
  1
)
assert.equal(countStaffOpsAlerts({ kitchenPending: 2, tableCallsPending: 1 }), 3)
assert.equal(countStaffOpsAlerts(null), 0)

console.log('adaptive-polling OK')
