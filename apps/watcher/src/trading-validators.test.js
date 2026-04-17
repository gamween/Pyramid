import test from "node:test"
import assert from "node:assert/strict"
import { assertSupportedOrderPayload, assertSupportedSchedulePayload } from "./trading-validators.js"

test("assertSupportedOrderPayload rejects BUY orders", () => {
  assert.throws(() => assertSupportedOrderPayload({ side: "BUY", orderType: "STOP_LOSS" }), /disabled/)
})

test("assertSupportedSchedulePayload rejects BUY schedules", () => {
  assert.throws(() => assertSupportedSchedulePayload({ side: "BUY", slices: 4 }), /disabled/)
})
