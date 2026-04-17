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
    parsed.amountPerBuy = parsePositiveNumber(draft.amountPerBuy, "amount")
    parsed.totalAmount = parsed.amountPerBuy * slices
  } else {
    parsed.totalAmount = parsePositiveNumber(draft.amount, "amount")
    parsed.amountPerBuy = parsed.totalAmount / slices
  }

  return parsed
}
