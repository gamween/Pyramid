import { writeFile } from "node:fs/promises"
import { Client } from "xrpl"

const client = new Client("wss://wasm.devnet.rippletest.net:51233")
const TARGET_CURRENCY_A = "XRP_drops"
const TARGET_CURRENCY_B = "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD"

function findTargetChange(bookChangesResult) {
  return (bookChangesResult.changes ?? []).find(
    (change) => change.currency_a === TARGET_CURRENCY_A && change.currency_b === TARGET_CURRENCY_B
  )
}

async function findMostRecentBookChanges() {
  const ledger = await client.request({ command: "ledger", ledger_index: "validated" })
  const latestLedgerIndex = ledger.result.ledger_index

  for (let ledgerIndex = latestLedgerIndex; ledgerIndex >= 0; ledgerIndex -= 1) {
    try {
      const response = await client.request({
        command: "book_changes",
        ledger_index: ledgerIndex,
      })

      if (findTargetChange(response.result)) {
        return response.result
      }
    } catch {
      continue
    }
  }

  throw new Error("Unable to find a recent XRP/RLUSD book_changes entry on devnet")
}

async function main() {
  await client.connect()

  const bookChanges = await findMostRecentBookChanges()

  const bookOffers = await client.request({
    command: "book_offers",
    taker_pays: {
      currency: "USD",
      issuer: "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs",
    },
    taker_gets: { currency: "XRP" },
    limit: 20,
  })

  await writeFile(
    new URL("../lib/fixtures/xrp-rlusd.book-changes.json", import.meta.url),
    JSON.stringify(bookChanges, null, 2)
  )

  await writeFile(
    new URL("../lib/fixtures/xrp-rlusd.book-offers.json", import.meta.url),
    JSON.stringify(bookOffers.result, null, 2)
  )

  await client.disconnect()
}

void main()
