import { xrpToDrops } from "xrpl"

import { ADDRESSES } from "./constants.js"

function parsePositiveNumber(value, fieldName) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`Invalid ${fieldName}`)
  }

  return numericValue
}

function trimIssuedValue(value) {
  return Number(value.toFixed(6)).toString()
}

export function buildSpotOfferCreateTx({ account, side, baseAmount, limitPrice }) {
  if (!account) {
    throw new Error("Missing account")
  }

  const parsedAmount = parsePositiveNumber(baseAmount, "baseAmount")
  const parsedPrice = parsePositiveNumber(limitPrice, "limitPrice")
  const quoteValue = trimIssuedValue(parsedAmount * parsedPrice)

  const issuedAmount = {
    currency: "USD",
    issuer: ADDRESSES.RLUSD_ISSUER,
    value: quoteValue,
  }

  if (side === "sell") {
    return {
      TransactionType: "OfferCreate",
      Account: account,
      TakerGets: xrpToDrops(parsedAmount),
      TakerPays: issuedAmount,
    }
  }

  if (side === "buy") {
    return {
      TransactionType: "OfferCreate",
      Account: account,
      TakerGets: issuedAmount,
      TakerPays: xrpToDrops(parsedAmount),
    }
  }

  throw new Error("Invalid side")
}

export function buildOfferCancelTx({ account, offerSequence }) {
  if (!account) {
    throw new Error("Missing account")
  }

  if (!Number.isInteger(offerSequence) || offerSequence <= 0) {
    throw new Error("Invalid offerSequence")
  }

  return {
    TransactionType: "OfferCancel",
    Account: account,
    OfferSequence: offerSequence,
  }
}
