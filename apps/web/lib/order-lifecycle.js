export function getOpenOrderStatus() {
  return "open"
}

export function getHistoryOrderStatus({ type, txResult }) {
  if (!txResult) {
    return "pending"
  }

  if (txResult !== "tesSUCCESS") {
    return "failed"
  }

  if (type === "OfferCancel") {
    return "cancelled"
  }

  if (type === "OfferCreate") {
    return "submitted"
  }

  return "submitted"
}

export function toOrderRow(order) {
  return {
    id: order.id ?? `native:${order.sequence ?? order.hash ?? "row"}`,
    sequence: order.sequence ?? null,
    side: order.side ?? null,
    type: order.type ?? "limit",
    status: order.status ?? getOpenOrderStatus(order),
    price: order.price ?? null,
    baseAmount: order.baseAmount ?? null,
    quoteAmount: order.quoteAmount ?? null,
  }
}
