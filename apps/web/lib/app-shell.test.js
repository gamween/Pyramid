import test from "node:test"
import assert from "node:assert/strict"

import {
  APP_PRIMARY_NAV,
  DEFAULT_APP_ROUTE,
  FUTURE_APP_MODULES,
  LIVE_TRADE_ROUTE,
} from "./app-shell.js"

test("DEFAULT_APP_ROUTE points to the dedicated assets page", () => {
  assert.equal(DEFAULT_APP_ROUTE, "/app/assets")
})

test("APP_PRIMARY_NAV exposes the exchange-style top-level areas", () => {
  assert.deepEqual(
    APP_PRIMARY_NAV.map((item) => item.href),
    ["/app/assets", "/app/markets", "/app/trade/spot", "/app/orders"]
  )
  assert.deepEqual(
    APP_PRIMARY_NAV.map((item) => item.label),
    ["Assets", "Markets", "Trade", "Orders"]
  )
})

test("LIVE_TRADE_ROUTE keeps spot as the active trading surface", () => {
  assert.equal(LIVE_TRADE_ROUTE.href, "/app/trade/spot/xrp-rlusd")
  assert.equal(LIVE_TRADE_ROUTE.label, "Spot")
  assert.equal(LIVE_TRADE_ROUTE.stage, "live")
})

test("FUTURE_APP_MODULES keeps future product areas explicit", () => {
  assert.deepEqual(
    FUTURE_APP_MODULES.map((item) => [item.key, item.stage]),
    [
      ["trailing-stop", "placeholder"],
      ["dca", "placeholder"],
      ["twap", "placeholder"],
      ["lending", "later"],
      ["privacy", "later"],
    ]
  )
})
