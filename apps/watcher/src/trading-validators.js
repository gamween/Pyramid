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

function assertFinitePositiveAmount(value, fieldName) {
  const numericValue = typeof value === "string" ? Number(value) : value
  assertFinitePositiveNumber(numericValue, fieldName)
}

export function assertSupportedOrderPayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short advanced orders are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.orderType) {
    throw new Error("Missing required order fields")
  }

  assertFinitePositiveInteger(payload.escrowSequence, "escrowSequence")
  assertFinitePositiveAmount(payload.amount, "amount")

  if (payload.orderType === "STOP_LOSS" || payload.orderType === "TAKE_PROFIT") {
    assertFinitePositiveNumber(payload.triggerPrice, "triggerPrice")
  } else if (payload.orderType === "TRAILING_STOP") {
    assertFinitePositiveInteger(payload.trailingPct, "trailingPct")
  } else if (payload.orderType === "OCO") {
    assertFinitePositiveNumber(payload.tpPrice, "tpPrice")
    assertFinitePositiveNumber(payload.slPrice, "slPrice")
  }
}

export function assertSupportedSchedulePayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short DCA/TWAP schedules are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.slices) {
    throw new Error("Missing required schedule fields")
  }

  assertFinitePositiveInteger(payload.escrowSequence, "escrowSequence")
  assertFinitePositiveInteger(payload.slices, "slices")
  assertFinitePositiveAmount(payload.totalAmount, "totalAmount")
  assertFinitePositiveAmount(payload.perSliceAmount, "perSliceAmount")
  assertFinitePositiveInteger(payload.intervalMs, "intervalMs")
}
