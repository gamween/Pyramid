export function assertSupportedOrderPayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short advanced orders are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.orderType) {
    throw new Error("Missing required order fields")
  }
}

export function assertSupportedSchedulePayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short DCA/TWAP schedules are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.slices) {
    throw new Error("Missing required schedule fields")
  }
}
