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

test("aggregateLedgerChangesToCandles converts XRP drops to XRP OHLC rows", () => {
  const candles = aggregateLedgerChangesToCandles([fixture], "1m")

  assert.deepEqual(candles, [
    {
      time: 1776778800,
      open: 0.4262575,
      high: 0.4262575,
      low: 0.4262575,
      close: 0.4262575,
    },
  ])
})
