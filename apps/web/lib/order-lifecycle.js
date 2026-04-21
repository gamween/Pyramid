export function getOpenOrderStatus() {
  return "open"
}

export function toOrderRow(order) {
  const row = {
    id: order.id ?? `native:${order.sequence ?? order.hash ?? "row"}`,
    sequence: order.sequence ?? null,
    side: order.side ?? null,
    type: order.type ?? "limit",
    status: order.status ?? getOpenOrderStatus(order),
    price: order.price ?? null,
    baseAmount: order.baseAmount ?? null,
    quoteAmount: order.quoteAmount ?? null,
  }

  if (order.hash) {
    row.hash = order.hash
  }

  if (order.timestamp) {
    row.timestamp = order.timestamp
  }

  if (order.result) {
    row.result = order.result
  }

  return row
}
