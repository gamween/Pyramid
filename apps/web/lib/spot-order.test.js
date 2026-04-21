import test from "node:test"
import assert from "node:assert/strict"

import { ADDRESSES } from "./constants.js"
import { buildOfferCancelTx, buildSpotOfferCreateTx } from "./spot-order.js"

test("buildSpotOfferCreateTx builds a sell-side XRP to RLUSD offer", () => {
  const tx = buildSpotOfferCreateTx({
    account: "rSell",
    side: "sell",
    baseAmount: "12.5",
    limitPrice: "0.84",
  })

  assert.equal(tx.Account, "rSell")
  assert.equal(tx.TransactionType, "OfferCreate")
  assert.equal(tx.TakerGets, "12500000")
  assert.deepEqual(tx.TakerPays, {
    currency: "USD",
    issuer: ADDRESSES.RLUSD_ISSUER,
    value: "10.5",
  })
})

test("buildSpotOfferCreateTx builds a buy-side XRP offer funded in RLUSD", () => {
  const tx = buildSpotOfferCreateTx({
    account: "rBuy",
    side: "buy",
    baseAmount: "3",
    limitPrice: "0.5",
  })

  assert.equal(tx.Account, "rBuy")
  assert.equal(tx.TransactionType, "OfferCreate")
  assert.deepEqual(tx.TakerGets, {
    currency: "USD",
    issuer: ADDRESSES.RLUSD_ISSUER,
    value: "1.5",
  })
  assert.equal(tx.TakerPays, "3000000")
})

test("buildSpotOfferCreateTx rejects a missing account", () => {
  assert.throws(
    () =>
      buildSpotOfferCreateTx({
        side: "buy",
        baseAmount: "3",
        limitPrice: "0.5",
      }),
    /Missing account/
  )
})

test("buildSpotOfferCreateTx rejects an invalid base amount", () => {
  assert.throws(
    () =>
      buildSpotOfferCreateTx({
        account: "rBad",
        side: "buy",
        baseAmount: "0",
        limitPrice: "0.5",
      }),
    /Invalid baseAmount/
  )
})

test("buildSpotOfferCreateTx rejects an invalid limit price", () => {
  assert.throws(
    () =>
      buildSpotOfferCreateTx({
        account: "rBad",
        side: "buy",
        baseAmount: "3",
        limitPrice: "0",
      }),
    /Invalid limitPrice/
  )
})

test("buildSpotOfferCreateTx rejects an invalid side before parsing amounts", () => {
  assert.throws(
    () =>
      buildSpotOfferCreateTx({
        account: "rBad",
        side: "hold",
        baseAmount: "abc",
        limitPrice: "0.5",
      }),
    /Invalid side/
  )
})

test("buildOfferCancelTx targets an open offer sequence directly on-ledger", () => {
  assert.deepEqual(buildOfferCancelTx({ account: "rCancel", offerSequence: 42 }), {
    TransactionType: "OfferCancel",
    Account: "rCancel",
    OfferSequence: 42,
  })
})
