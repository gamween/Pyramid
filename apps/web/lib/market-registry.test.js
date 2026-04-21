import test from "node:test"
import assert from "node:assert/strict"

import { ACTIVE_SPOT_MARKET, LIVE_MARKETS, getMarketBySlug } from "./market-registry.js"

test("the live market registry only exposes XRP / RLUSD", () => {
  assert.equal(LIVE_MARKETS.length, 1)
  assert.equal(ACTIVE_SPOT_MARKET.symbol, "XRP / RLUSD")
  assert.equal(ACTIVE_SPOT_MARKET.slug, "xrp-rlusd")
  assert.equal(getMarketBySlug("xrp-rlusd")?.symbol, "XRP / RLUSD")
})
