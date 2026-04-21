import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"

const forbiddenPaths = [
  "../../watcher",
  "../app/api/dca/route.js",
  "../app/api/orders/route.js",
  "../app/api/orders/[owner]/[sequence]/route.js",
  "../app/api/loans",
  "../app/api/watcher-url.js",
  "../components/AdvancedTradingForm.js",
  "../components/ActivePositions.js",
  "../components/LoansPage.js",
  "../hooks/useLoanMarket.js",
  "./order-state.js",
]

test("watcher-era backend and loan files are removed from the active repo", () => {
  for (const relativePath of forbiddenPaths) {
    assert.equal(existsSync(new URL(relativePath, import.meta.url)), false, relativePath)
  }
})
