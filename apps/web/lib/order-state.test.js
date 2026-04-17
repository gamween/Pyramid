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

test("normalizeWatcherState keeps cancelable metadata for tracked orders", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rOwner:33": {
        owner: "rOwner",
        escrowSequence: 33,
        orderType: "TRAILING_STOP",
        amount: "5000000",
        trailingPct: 150,
        status: "ACTIVE",
      },
    },
  })

  assert.equal(normalized.orders[0].sequence, 33)
  assert.match(normalized.orders[0].trigger, /150/)
})

test("normalizeWatcherState exposes truthful action metadata per row", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rActive:10": {
        owner: "rActive",
        escrowSequence: 10,
        orderType: "STOP_LOSS",
        amount: "1000000",
        triggerPrice: "0.50",
        status: "ACTIVE",
      },
      "rDone:11": {
        owner: "rDone",
        escrowSequence: 11,
        orderType: "TRAILING_STOP",
        amount: "1000000",
        trailingPct: 125,
        status: "FILLED",
      },
    },
    dcaSchedules: {
      activeSchedule: {
        id: "activeSchedule",
        owner: "rSched",
        escrowSequence: 20,
        side: "SELL",
        perSliceAmount: "250000",
        completed: 0,
        total: 4,
        status: "ACTIVE",
        escrowFinished: false,
      },
      finishedSchedule: {
        id: "finishedSchedule",
        owner: "rSchedDone",
        escrowSequence: 21,
        side: "SELL",
        perSliceAmount: "250000",
        completed: 4,
        total: 4,
        status: "COMPLETED",
        escrowFinished: true,
      },
    },
  })

  assert.ok(Object.hasOwn(normalized.orders[0], "canStopTracking"))
  assert.ok(Object.hasOwn(normalized.orders[0], "canCancelEscrow"))
  assert.ok(Object.hasOwn(normalized.orders[1], "canStopTracking"))
  assert.ok(Object.hasOwn(normalized.orders[1], "canCancelEscrow"))
  assert.ok(Object.hasOwn(normalized.schedules[0], "canStopTracking"))
  assert.ok(Object.hasOwn(normalized.schedules[0], "canCancelEscrow"))
  assert.ok(Object.hasOwn(normalized.schedules[1], "canStopTracking"))
  assert.ok(Object.hasOwn(normalized.schedules[1], "canCancelEscrow"))
  assert.equal(normalized.orders[0].canStopTracking, true)
  assert.equal(normalized.orders[0].canCancelEscrow, true)
  assert.equal(normalized.orders[1].canStopTracking, true)
  assert.equal(normalized.orders[1].canCancelEscrow, false)
  assert.equal(normalized.schedules[0].canStopTracking, false)
  assert.equal(normalized.schedules[0].canCancelEscrow, false)
  assert.equal(normalized.schedules[1].canStopTracking, false)
  assert.equal(normalized.schedules[1].canCancelEscrow, false)
})
