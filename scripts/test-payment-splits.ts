import assert from 'node:assert/strict'
import {
  allocateSplitsAcrossOrders,
  assertPaymentSplitsMatchTotal,
  normalizePaymentSplits,
  sumSplitAmounts,
} from '../lib/payment-splits'

const normalized = normalizePaymentSplits([
  { method: 'cash', amount: 100 },
  { method: 'cash', amount: 50.005 },
  { method: 'transfer', amount: 49.995 },
  { method: 'card', amount: 0 },
])

assert.deepEqual(normalized, [
  { method: 'cash', amount: 150.01 },
  { method: 'transfer', amount: 50 },
])

assert.equal(sumSplitAmounts(normalized), 200.01)

assert.throws(() => assertPaymentSplitsMatchTotal(100, [{ method: 'cash', amount: 100 }]), /PAYMENT_SPLITS_REQUIRED/)
assert.throws(
  () =>
    assertPaymentSplitsMatchTotal(100, [
      { method: 'cash', amount: 40 },
      { method: 'transfer', amount: 50 },
    ]),
  /PAYMENT_SPLITS_MISMATCH/
)

const ok = assertPaymentSplitsMatchTotal(100, [
  { method: 'cash', amount: 40 },
  { method: 'transfer', amount: 60 },
])
assert.deepEqual(ok, [
  { method: 'cash', amount: 40 },
  { method: 'transfer', amount: 60 },
])

const allocated = allocateSplitsAcrossOrders(
  [
    { id: 'a', total: 600 },
    { id: 'b', total: 400 },
  ],
  [
    { method: 'cash', amount: 700 },
    { method: 'transfer', amount: 300 },
  ]
)

assert.equal(allocated.length, 2)
assert.equal(sumSplitAmounts(allocated[0].splits) + sumSplitAmounts(allocated[1].splits), 1000)
assert.equal(
  allocated.flatMap((entry) => entry.splits.filter((s) => s.method === 'cash')).reduce((s, x) => s + x.amount, 0),
  700
)

console.log('payment-splits tests OK')
