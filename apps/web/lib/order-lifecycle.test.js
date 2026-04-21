import test from "node:test"
import assert from "node:assert/strict"

import {
  getHistoryOrderStatus,
  getOpenOrderStatus,
  normalizeHistoryOrderRow,
  toOrderRow,
} from "./order-lifecycle.js"

test("open offers normalize to the open status", () => {
  assert.equal(getOpenOrderStatus({ sequence: 7 }), "open")
})

test("toOrderRow returns the canonical table shape", () => {
  const row = toOrderRow({
    sequence: 7,
    side: "buy",
    type: "limit",
    price: 0.5,
    baseAmount: 3,
    quoteAmount: 1.5,
  })

  assert.deepEqual(Object.keys(row), [
    "id",
    "sequence",
    "side",
    "type",
    "status",
    "price",
    "baseAmount",
    "quoteAmount",
  ])
})

test("history rows map successful offer create transactions to submitted", () => {
  assert.equal(getHistoryOrderStatus({ type: "OfferCreate", txResult: "tesSUCCESS" }), "submitted")
})

test("history rows map successful offer cancel transactions to cancelled", () => {
  assert.equal(getHistoryOrderStatus({ type: "OfferCancel", txResult: "tesSUCCESS" }), "cancelled")
})

test("history rows map non-success results to failed", () => {
  assert.equal(getHistoryOrderStatus({ type: "OfferCreate", txResult: "tecUNFUNDED_OFFER" }), "failed")
})

test("history rows map missing results to pending", () => {
  assert.equal(getHistoryOrderStatus({ type: "OfferCreate" }), "pending")
})

test("toOrderRow does not include transaction-specific metadata", () => {
  const row = toOrderRow({
    sequence: 7,
    side: "buy",
    type: "limit",
    status: "submitted",
    price: 0.5,
    baseAmount: 3,
    quoteAmount: 1.5,
    hash: "ABC123",
    timestamp: "today",
    txResult: "tesSUCCESS",
  })

  assert.equal("hash" in row, false)
  assert.equal("timestamp" in row, false)
  assert.equal("txResult" in row, false)
})

test("normalizeHistoryOrderRow preserves side when an offer create entry includes order amounts", () => {
  const row = normalizeHistoryOrderRow({
    tx_json: {
      hash: "ABC123",
      TransactionType: "OfferCreate",
      Sequence: 17,
      TakerGets: "5000000",
      TakerPays: { currency: "USD", issuer: "issuer", value: "3.25" },
    },
    meta: {
      TransactionResult: "tesSUCCESS",
    },
  })

  assert.equal(row.side, "sell")
  assert.equal(row.status, "submitted")
  assert.equal(row.txResult, "tesSUCCESS")
})
