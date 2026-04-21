import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { ADVANCED_ORDER_STATUSES, createAdvancedOrderDraft } from "./advanced-orders/drafts.js"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("advanced-order domain exposes the canonical status vocabulary", () => {
  assert.deepEqual(ADVANCED_ORDER_STATUSES, [
    "draft",
    "awaiting signature",
    "submitted",
    "pending confirmation",
    "active",
    "tracking",
    "triggered",
    "executing",
    "open",
    "partially filled",
    "filled",
    "completed",
    "cancelled",
    "failed",
    "expired",
  ])
})

test("createAdvancedOrderDraft keeps market, type, side, and trigger fields together", () => {
  const draft = createAdvancedOrderDraft({
    market: "xrp-rlusd",
    type: "STOP_LOSS",
    side: "SELL",
  })

  assert.deepEqual(draft, {
    id: null,
    market: "xrp-rlusd",
    type: "STOP_LOSS",
    side: "SELL",
    status: "draft",
    createdAt: null,
    trigger: null,
    schedule: null,
  })
})

test("trade and orders surfaces keep advanced-order wording explicit and empty", () => {
  const tradeWorkspaceSource = readSource("../components/app/TradeSpotWorkspace.js")
  const ordersWorkspaceSource = readSource("../components/app/OrdersWorkspace.js")

  assert.match(
    tradeWorkspaceSource,
    /This tool uses the final advanced-order domain model now, but its on-chain\s+executor is not wired in this pass\./
  )
  assert.match(ordersWorkspaceSource, /\["advanced", "Advanced schedules"\]/)
  assert.match(
    ordersWorkspaceSource,
    /Advanced orders and schedules will appear here once the on-chain executor is\s+integrated\./
  )
})
