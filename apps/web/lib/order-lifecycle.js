export function getOpenOrderStatus() {
  return "open"
}

function dropsToXrp(drops) {
  return Number(drops) / 1_000_000
}

function readIssuedValue(amount) {
  return Number(amount?.value ?? 0)
}

function formatLedgerTime(xrplTime) {
  if (!xrplTime) return "Pending"
  return new Date((xrplTime + 946684800) * 1000).toLocaleString()
}

export function getLedgerOrderAmounts(takerGets, takerPays) {
  const isSell = typeof takerGets === "string"
  const baseAmount = isSell ? dropsToXrp(takerGets) : dropsToXrp(takerPays)
  const quoteAmount = isSell ? readIssuedValue(takerPays) : readIssuedValue(takerGets)
  const price = baseAmount > 0 ? quoteAmount / baseAmount : 0

  return {
    side: isSell ? "sell" : "buy",
    baseAmount,
    quoteAmount,
    price,
  }
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

export function normalizeHistoryOrderRow(entry) {
  const tx = entry.tx_json ?? entry.tx ?? {}
  const txResult = entry.meta?.TransactionResult
  const isOfferCreate = tx.TransactionType === "OfferCreate"
  const amounts =
    isOfferCreate && tx.TakerGets != null && tx.TakerPays != null
      ? getLedgerOrderAmounts(tx.TakerGets, tx.TakerPays)
      : {}

  return {
    ...toOrderRow({
      id: tx.hash ? `native:${tx.hash}` : undefined,
      type: tx.TransactionType ?? "Unknown",
      sequence: tx.Sequence ?? tx.OfferSequence ?? null,
      status: getHistoryOrderStatus({
        type: tx.TransactionType,
        txResult,
      }),
      ...amounts,
    }),
    txResult: txResult ?? "Pending",
    id: tx.hash ? `native:${tx.hash}` : undefined,
    hash: tx.hash,
    timestamp: formatLedgerTime(tx.date),
  }
}
