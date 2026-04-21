import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("useSpotMarket reads the normalized XRPL market feed instead of reshaping raw offers locally", () => {
  const source = readFileSync(new URL("./useSpotMarket.js", import.meta.url), "utf8")

  assert.match(source, /fetchXRPLMarketFeed/)
  assert.doesNotMatch(source, /getClient/)
})
