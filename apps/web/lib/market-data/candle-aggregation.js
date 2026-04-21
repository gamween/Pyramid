import { bucketTimestamp } from "./timeframes.js"

const XRP_DROPS_PER_XRP = 1_000_000
const RIPPLE_EPOCH_TO_UNIX_SECONDS = 946_684_800
const TARGET_CURRENCY_A = "XRP_drops"
const TARGET_CURRENCY_B = "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD"

function dropsToXrp(value) {
  return Number(value) / XRP_DROPS_PER_XRP
}

function xrpPerRlusdToRlusdPerXrp(xrpPerRlusd) {
  if (xrpPerRlusd <= 0) return 0
  return 1 / xrpPerRlusd
}

function changePriceToRlusdPerXrp(changePrice) {
  const xrpPerRlusd = dropsToXrp(changePrice)
  return xrpPerRlusdToRlusdPerXrp(xrpPerRlusd)
}

function ledgerTimeToUnixMs(ledgerTime) {
  return (Number(ledgerTime) + RIPPLE_EPOCH_TO_UNIX_SECONDS) * 1000
}

export function extractMarketLedgerChange(bookChangesResult, currencyA, currencyB) {
  return (
    (bookChangesResult.changes ?? []).find(
      (change) => change.currency_a === currencyA && change.currency_b === currencyB
    ) ?? null
  )
}

export function aggregateLedgerChangesToCandles(results, timeframe) {
  const buckets = new Map()
  const orderedResults = [...results].sort((left, right) => Number(left.ledger_time) - Number(right.ledger_time))

  for (const result of orderedResults) {
    const change = extractMarketLedgerChange(result, TARGET_CURRENCY_A, TARGET_CURRENCY_B)
    if (!change) continue

    const bucket = bucketTimestamp(ledgerTimeToUnixMs(result.ledger_time), timeframe)
    const open = changePriceToRlusdPerXrp(change.open)
    const high = changePriceToRlusdPerXrp(change.high)
    const low = changePriceToRlusdPerXrp(change.low)
    const close = changePriceToRlusdPerXrp(change.close)

    const existing = buckets.get(bucket)
    if (!existing) {
      buckets.set(bucket, {
        time: bucket / 1000,
        open,
        high,
        low,
        close,
      })
      continue
    }

    existing.high = Math.max(existing.high, high)
    existing.low = Math.min(existing.low, low)
    existing.close = close
  }

  return [...buckets.values()].sort((left, right) => left.time - right.time)
}
