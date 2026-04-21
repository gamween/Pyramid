import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import fixtureLedgerChange from "./fixtures/xrp-rlusd.book-changes.json" with { type: "json" }

import {
  SEEDED_SNAPSHOT_NOTE,
  buildSeededChartState,
  normalizeXRPLMarketBook,
} from "./market-data/xrpl-market-feed.js"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("TradeSpotWorkspace composes the XRPL market-data hook with the trading chart component", () => {
  const source = readSource("../components/app/TradeSpotWorkspace.js")

  assert.match(source, /useXRPLMarketData/)
  assert.match(source, /TradingChart/)
  assert.match(source, /const\s*\{[\s\S]*candles[\s\S]*timeframe[\s\S]*setTimeframe[\s\S]*timeframeLocked[\s\S]*seedNote[\s\S]*\}\s*=\s*useXRPLMarketData\(/)
  assert.match(source, /<TradingChart/)
  assert.match(source, /disabled=\{timeframeLocked && timeframe !== option\}/)
  assert.match(source, /Seeded ledger snapshot/)
  assert.match(source, /\{seedNote\}/)
  assert.doesNotMatch(source, /function Sparkline/)
})

test("buildSeededChartState keeps timeframe switching locked when only a seeded snapshot exists", () => {
  const seededState = buildSeededChartState({
    results: [fixtureLedgerChange],
    timeframe: "15m",
  })

  assert.equal(seededState.timeframeLocked, true)
  assert.equal(seededState.seedNote, SEEDED_SNAPSHOT_NOTE)
  assert.equal(seededState.candles.length, 1)
})

test("normalizeXRPLMarketBook sorts both sides correctly and prefers funded amounts", () => {
  const marketBook = normalizeXRPLMarketBook({
    asksResponse: {
      result: {
        offers: [
          {
            TakerGets: "2000000",
            TakerPays: { currency: "USD", issuer: "issuer", value: "1.2" },
          },
          {
            TakerGets: "5000000",
            TakerPays: { currency: "USD", issuer: "issuer", value: "2.75" },
            taker_gets_funded: "1000000",
            taker_pays_funded: { currency: "USD", issuer: "issuer", value: "0.65" },
          },
        ],
      },
    },
    bidsResponse: {
      result: {
        offers: [
          {
            TakerPays: "4000000",
            TakerGets: { currency: "USD", issuer: "issuer", value: "2.24" },
          },
          {
            TakerPays: "6000000",
            TakerGets: { currency: "USD", issuer: "issuer", value: "3.3" },
            taker_pays_funded: "2000000",
            taker_gets_funded: { currency: "USD", issuer: "issuer", value: "1.2" },
          },
        ],
      },
    },
  })

  assert.deepEqual(marketBook.asks, [
    { price: 0.6, amount: 2, total: 1.2 },
    { price: 0.65, amount: 1, total: 0.65 },
  ])
  assert.deepEqual(marketBook.bids, [
    { price: 0.6, amount: 2, total: 1.2 },
    { price: 0.56, amount: 4, total: 2.24 },
  ])
  assert.equal(marketBook.bestAsk, 0.6)
  assert.equal(marketBook.bestBid, 0.6)
})
