import test from "node:test"
import assert from "node:assert/strict"

import { validateSellOrderDraft, validateSellScheduleDraft } from "./trading-validators.js"

test("validateSellOrderDraft rejects invalid stop-loss and take-profit trigger prices", () => {
  assert.throws(() => validateSellOrderDraft({ type: "SL", amount: "100", triggerPrice: "" }), /triggerPrice/)
  assert.throws(() => validateSellOrderDraft({ type: "TP", amount: "100", triggerPrice: "0" }), /triggerPrice/)
})

test("validateSellOrderDraft rejects invalid trailing trailingPct values", () => {
  assert.throws(() => validateSellOrderDraft({ type: "TRAILING", amount: "100", trailingPct: "" }), /trailingPct/)
  assert.throws(() => validateSellOrderDraft({ type: "TRAILING", amount: "100", trailingPct: "1.5" }), /trailingPct/)
})

test("validateSellOrderDraft rejects invalid OCO tp/sl values", () => {
  assert.throws(() => validateSellOrderDraft({ type: "OCO", amount: "100", tpPrice: "0.65", slPrice: "" }), /slPrice/)
  assert.throws(() => validateSellOrderDraft({ type: "OCO", amount: "100", tpPrice: "-1", slPrice: "0.45" }), /tpPrice/)
})

test("validateSellScheduleDraft rejects invalid DCA and TWAP numeric inputs", () => {
  assert.throws(
    () => validateSellScheduleDraft({ type: "DCA", amountPerBuy: "", numBuys: "4", ticketInterval: "60" }),
    /amount/
  )
  assert.throws(
    () => validateSellScheduleDraft({ type: "TWAP", amount: "100", numBuys: "0", ticketInterval: "60" }),
    /slices/
  )
  assert.throws(
    () => validateSellScheduleDraft({ type: "TWAP", amount: "100", numBuys: "4", ticketInterval: "0" }),
    /intervalMs/
  )
})

test("validateSellScheduleDraft rejects sub-drop DCA and TWAP amounts", () => {
  assert.throws(
    () => validateSellScheduleDraft({ type: "DCA", amountPerBuy: "0.0000005", numBuys: "4", ticketInterval: "60" }),
    /amount/
  )
  assert.throws(
    () => validateSellScheduleDraft({ type: "TWAP", amount: "0.0000005", numBuys: "4", ticketInterval: "60" }),
    /amount/
  )
})

test("validateSellScheduleDraft rejects TWAP totals that do not divide into whole-drop slices", () => {
  assert.throws(
    () => validateSellScheduleDraft({ type: "TWAP", amount: "0.000002", numBuys: "3", ticketInterval: "60" }),
    /amount/
  )
})
