import test from "node:test"
import assert from "node:assert/strict"
import fixture from "../fixtures/xrp-rlusd.book-changes.json" with { type: "json" }

import { aggregateLedgerChangesToCandles, extractMarketLedgerChange } from "./candle-aggregation.js"

test("extractMarketLedgerChange selects the XRP / RLUSD ledger change", () => {
  const change = extractMarketLedgerChange(
    fixture,
    "XRP_drops",
    "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD"
  )

  assert.deepEqual(change, {
    close: "426257.5",
    currency_a: "XRP_drops",
    currency_b: "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD",
    high: "426257.5",
    low: "426257.5",
    open: "426257.5",
    volume_a: "852515",
    volume_b: "2",
  })
})

test("aggregateLedgerChangesToCandles normalizes XRP-drops price into RLUSD per XRP candles", () => {
  const candles = aggregateLedgerChangesToCandles([fixture], "1m")

  assert.deepEqual(candles, [
    {
      time: 1776778800,
      open: 2.345999777130021,
      high: 2.345999777130021,
      low: 2.345999777130021,
      close: 2.345999777130021,
    },
  ])
})
