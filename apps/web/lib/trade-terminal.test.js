import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("TradeSpotWorkspace composes the XRPL market-data hook with the trading chart component", () => {
  const source = readSource("../components/app/TradeSpotWorkspace.js")

  assert.match(source, /useXRPLMarketData/)
  assert.match(source, /TradingChart/)
  assert.match(source, /const\s*\{[\s\S]*candles[\s\S]*timeframe[\s\S]*setTimeframe[\s\S]*\}\s*=\s*useXRPLMarketData\(/)
  assert.match(source, /<TradingChart/)
  assert.doesNotMatch(source, /function Sparkline/)
})
