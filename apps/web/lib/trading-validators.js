const DROPS_PER_XRP = 1_000_000

function assertFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

function assertFinitePositiveNumber(value, fieldName) {
  assertFiniteNumber(value, fieldName)
  if (value <= 0) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

function assertFinitePositiveInteger(value, fieldName) {
  assertFinitePositiveNumber(value, fieldName)
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

function parsePositiveNumber(value, fieldName) {
  const numericValue = Number(value)
  assertFinitePositiveNumber(numericValue, fieldName)
  return numericValue
}

function parsePositiveInteger(value, fieldName) {
  const numericValue = Number(value)
  assertFinitePositiveInteger(numericValue, fieldName)
  return numericValue
}

function parsePositiveDropAmount(value, fieldName) {
  const text = String(value).trim()
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    throw new Error(`Invalid ${fieldName}`)
  }

  const [wholePart, fractionalPart = ""] = text.split(".")
  if (fractionalPart.length > 6) {
    throw new Error(`Invalid ${fieldName}`)
  }

  const totalDrops = Number(wholePart) * DROPS_PER_XRP + Number(fractionalPart.padEnd(6, "0"))
  if (!Number.isFinite(totalDrops) || totalDrops < 1 || !Number.isInteger(totalDrops)) {
    throw new Error(`Invalid ${fieldName}`)
  }

  return totalDrops
}

export function validateSellOrderDraft(draft) {
  const parsed = {
    amount: parsePositiveNumber(draft.amount, "amount"),
  }

  if (draft.type === "SL" || draft.type === "TP") {
    parsed.triggerPrice = parsePositiveNumber(draft.triggerPrice, "triggerPrice")
  } else if (draft.type === "TRAILING") {
    parsed.trailingPct = parsePositiveInteger(draft.trailingPct, "trailingPct")
  } else if (draft.type === "OCO") {
    parsed.tpPrice = parsePositiveNumber(draft.tpPrice, "tpPrice")
    parsed.slPrice = parsePositiveNumber(draft.slPrice, "slPrice")
  }

  return parsed
}

export function validateSellScheduleDraft(draft) {
  const slices = parsePositiveInteger(draft.numBuys, "slices")
  const intervalSeconds = parsePositiveInteger(draft.ticketInterval, "intervalMs")
  const parsed = {
    slices,
    intervalMs: intervalSeconds * 1000,
  }

  if (draft.type === "DCA") {
    const amountPerBuyDrops = parsePositiveDropAmount(draft.amountPerBuy, "amount")
    parsed.amountPerBuy = String(amountPerBuyDrops)
    parsed.totalAmount = String(amountPerBuyDrops * slices)
  } else {
    const totalAmountDrops = parsePositiveDropAmount(draft.amount, "amount")
    if (totalAmountDrops % slices !== 0) {
      throw new Error("Invalid amount")
    }

    parsed.totalAmount = String(totalAmountDrops)
    parsed.amountPerBuy = String(totalAmountDrops / slices)
  }

  return parsed
}
