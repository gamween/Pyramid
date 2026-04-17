import test from "node:test"
import assert from "node:assert/strict"
import { assertSupportedOrderPayload, assertSupportedSchedulePayload } from "./trading-validators.js"

test("assertSupportedOrderPayload rejects BUY orders", () => {
  assert.throws(() => assertSupportedOrderPayload({ side: "BUY", orderType: "STOP_LOSS" }), /disabled/)
})

test("assertSupportedOrderPayload accepts valid SELL orders", () => {
  assert.doesNotThrow(() =>
    assertSupportedOrderPayload({
      side: "SELL",
      orderType: "STOP_LOSS",
      owner: "rOwner",
      escrowSequence: 12,
      amount: "1000000",
      triggerPrice: 0.55,
    })
  )
})

test("assertSupportedOrderPayload rejects malformed SELL orders", () => {
  assert.throws(
    () =>
      assertSupportedOrderPayload({
        side: "SELL",
        orderType: "STOP_LOSS",
        owner: "rOwner",
        escrowSequence: 12,
        amount: "1000000",
        triggerPrice: Number.NaN,
      }),
    /triggerPrice/
  )
})

test("assertSupportedOrderPayload rejects decimal-drop SELL amounts", () => {
  assert.throws(
    () =>
      assertSupportedOrderPayload({
        side: "SELL",
        orderType: "STOP_LOSS",
        owner: "rOwner",
        escrowSequence: 12,
        amount: "1000000.5",
        triggerPrice: 0.55,
      }),
    /amount/
  )
})

test("assertSupportedOrderPayload rejects unknown SELL order types", () => {
  assert.throws(
    () =>
      assertSupportedOrderPayload({
        side: "SELL",
        orderType: "WHATEVER",
        owner: "rOwner",
        escrowSequence: 12,
        amount: "1000000",
      }),
    /Unsupported orderType/
  )
})

test("assertSupportedSchedulePayload rejects BUY schedules", () => {
  assert.throws(() => assertSupportedSchedulePayload({ side: "BUY", slices: 4 }), /disabled/)
})

test("assertSupportedSchedulePayload accepts valid SELL schedules", () => {
  assert.doesNotThrow(() =>
    assertSupportedSchedulePayload({
      side: "SELL",
      owner: "rOwner",
      escrowSequence: 44,
      slices: 4,
      totalAmount: "4000000",
      perSliceAmount: "1000000",
      intervalMs: 30000,
    })
  )
})

test("assertSupportedSchedulePayload rejects malformed SELL schedules", () => {
  assert.throws(
    () =>
      assertSupportedSchedulePayload({
        side: "SELL",
        owner: "rOwner",
        escrowSequence: 44,
        slices: 4,
        totalAmount: "4000000",
        perSliceAmount: "1000000",
        intervalMs: Number.NaN,
      }),
    /intervalMs/
  )
})

test("assertSupportedSchedulePayload rejects decimal-drop SELL schedule amounts", () => {
  assert.throws(
    () =>
      assertSupportedSchedulePayload({
        side: "SELL",
        owner: "rOwner",
        escrowSequence: 44,
        slices: 4,
        totalAmount: "4000000.5",
        perSliceAmount: "1000000",
        intervalMs: 30000,
      }),
    /totalAmount/
  )
  assert.throws(
    () =>
      assertSupportedSchedulePayload({
        side: "SELL",
        owner: "rOwner",
        escrowSequence: 44,
        slices: 4,
        totalAmount: "4000000",
        perSliceAmount: "1000000.5",
        intervalMs: 30000,
      }),
    /perSliceAmount/
  )
})
