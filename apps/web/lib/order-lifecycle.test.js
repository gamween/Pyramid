import test from "node:test"
import assert from "node:assert/strict"

import { getOpenOrderStatus, toOrderRow } from "./order-lifecycle.js"

test("open offers normalize to the open status", () => {
  assert.equal(getOpenOrderStatus({ sequence: 7 }), "open")
})

test("toOrderRow returns the canonical table shape", () => {
  const row = toOrderRow({
    sequence: 7,
    side: "buy",
    type: "limit",
    price: 0.5,
    baseAmount: 3,
    quoteAmount: 1.5,
  })

  assert.deepEqual(Object.keys(row), [
    "id",
    "sequence",
    "side",
    "type",
    "status",
    "price",
    "baseAmount",
    "quoteAmount",
  ])
})
