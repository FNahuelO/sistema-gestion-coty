import assert from 'node:assert/strict'
import {
  normalizeOperationalDayCutoffTime,
  OPERATIONAL_DAY_CUTOFF_TIME,
  operationalDayEndISO,
  operationalDayKey,
  operationalDayStartISO,
  shiftDayKey,
} from '../lib/datetime'

const cutoff = OPERATIONAL_DAY_CUTOFF_TIME

assert.equal(normalizeOperationalDayCutoffTime(undefined), '01:00')
assert.equal(normalizeOperationalDayCutoffTime('2:30'), '02:30')
assert.equal(normalizeOperationalDayCutoffTime('25:00'), '01:00')

// 18/08/2026 23:30 AR → mismo día operativo
assert.equal(
  operationalDayKey(new Date('2026-08-19T02:30:00.000Z'), cutoff),
  '2026-08-18'
)

// 19/08/2026 00:30 AR → sigue siendo 18 operativo (antes del corte 01:00)
assert.equal(
  operationalDayKey(new Date('2026-08-19T03:30:00.000Z'), cutoff),
  '2026-08-18'
)

// 19/08/2026 01:00 AR → nuevo día operativo
assert.equal(
  operationalDayKey(new Date('2026-08-19T04:00:00.000Z'), cutoff),
  '2026-08-19'
)

const dayKey = '2026-08-18'
const start = new Date(operationalDayStartISO(dayKey, cutoff))
const end = new Date(operationalDayEndISO(dayKey, cutoff))

assert.equal(start.toISOString(), '2026-08-18T03:00:00.000Z')
assert.equal(end.toISOString(), '2026-08-19T03:59:59.999Z')

assert.equal(shiftDayKey('2026-08-18', -1), '2026-08-17')
assert.equal(shiftDayKey('2026-08-18', 1), '2026-08-19')

console.log('operational-day OK')
