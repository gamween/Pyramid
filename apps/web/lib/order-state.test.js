import test from "node:test"
import assert from "node:assert/strict"

import { normalizeWatcherState } from "./order-state.js"

test("normalizeWatcherState maps watcher orders and schedules into UI state", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rOwner:12": {
        owner: "rOwner",
        escrowSequence: 12,
        orderType: "STOP_LOSS",
        amount: "4200000",
        triggerPrice: "0.42",
      },
    },
    dcaSchedules: {
      scheduleA: {
        id: "scheduleA",
        owner: "rOwner",
        escrowSequence: 99,
        side: "SELL",
        perSliceAmount: "1000000",
        completed: 1,
        total: 4,
      },
    },
  })

  assert.equal(normalized.orders.length, 1)
  assert.equal(normalized.orders[0].id, "rOwner:12")
  assert.equal(normalized.orders[0].type, "STOP_LOSS")
  assert.match(normalized.orders[0].trigger, /0.42/)
  assert.equal(normalized.schedules.length, 1)
  assert.equal(normalized.schedules[0].id, "scheduleA")
  assert.equal(normalized.schedules[0].type, "DCA/TWAP")
  assert.match(normalized.schedules[0].trigger, /1\/4/)
  assert.match(normalized.schedules[0].progress, /1\/4/)
})
