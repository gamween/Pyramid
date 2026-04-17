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

test("normalizeWatcherState preserves zero-valued trigger fields", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rZero:1": {
        owner: "rZero",
        escrowSequence: 1,
        orderType: "STOP_LOSS",
        amount: "1000000",
        triggerPrice: 0,
      },
      "rZero:2": {
        owner: "rZero",
        escrowSequence: 2,
        orderType: "TRAILING_STOP",
        amount: "1000000",
        trailingPct: 0,
      },
      "rZero:3": {
        owner: "rZero",
        escrowSequence: 3,
        orderType: "TAKE_PROFIT_STOP_LOSS",
        amount: "1000000",
        tpPrice: 0,
        slPrice: 0,
      },
    },
  })

  assert.equal(normalized.orders[0].trigger, "Trigger @ 0")
  assert.equal(normalized.orders[1].trigger, "Trail 0 bps")
  assert.equal(normalized.orders[2].trigger, "TP 0 / SL 0")
})
