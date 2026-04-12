/**
 * Seed DEX liquidity on WASM devnet for demo purposes.
 * Creates standing offers on both sides of the XRP/USD book
 * so that DCA/TWAP IOC orders have something to fill against.
 *
 * Usage: node apps/web/scripts/seed-dex.mjs
 */
import { Client, Wallet } from "xrpl"

const WSS = "wss://wasm.devnet.rippletest.net:51233"
const FAUCET_HOST = "wasmfaucet.devnet.rippletest.net"
const RLUSD_ISSUER = "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs"
const PRICE = 2.3 // USD per XRP

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log("Connected to WASM devnet")

  // Create and fund a market-maker wallet
  const mm = Wallet.generate()
  console.log(`Market-maker: ${mm.address}`)

  for (let i = 0; i < 15; i++) {
    try {
      await client.fundWallet(mm, { faucetHost: FAUCET_HOST })
      process.stdout.write(`\r  Faucet ${i + 1}/15`)
    } catch {
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.log()

  // Set USD trustline
  console.log("Setting USD trustline...")
  await client.submitAndWait({
    TransactionType: "TrustSet",
    Account: mm.address,
    LimitAmount: { currency: "USD", issuer: RLUSD_ISSUER, value: "100000" },
  }, { wallet: mm, autofill: true })

  // Get some USD by placing a sell offer (sell XRP for USD)
  // First need someone to have USD... create a Payment from the issuer gateway
  // On devnet, we can get USD by trading XRP for it if there are existing offers
  // Or we create our own offers at various price levels

  // Place BUY orders (someone willing to buy XRP with USD)
  // These are what DCA SELL orders fill against
  // Format: taker pays XRP, taker gets USD → market maker offers USD, wants XRP
  const buyPrices = [PRICE * 0.98, PRICE * 0.99, PRICE, PRICE * 1.01, PRICE * 1.02]

  for (const p of buyPrices) {
    const xrpAmount = "500000000" // 500 XRP
    const usdAmount = (500 * p).toFixed(6)

    console.log(`Placing buy order: 500 XRP @ ${p.toFixed(4)} USD`)
    try {
      const result = await client.submitAndWait({
        TransactionType: "OfferCreate",
        Account: mm.address,
        // Market maker wants to BUY XRP: offers USD, wants XRP
        TakerPays: { currency: "USD", issuer: RLUSD_ISSUER, value: usdAmount },
        TakerGets: xrpAmount,
      }, { wallet: mm, autofill: true })
      console.log(`  → ${result.result.meta.TransactionResult}`)
    } catch (err) {
      console.log(`  → Failed: ${err.message}`)
    }
  }

  // Place SELL orders (someone willing to sell XRP for USD)
  // These are what DCA BUY orders fill against
  for (const p of buyPrices) {
    const xrpAmount = "500000000" // 500 XRP
    const usdAmount = (500 * p).toFixed(6)

    console.log(`Placing sell order: 500 XRP @ ${p.toFixed(4)} USD`)
    try {
      const result = await client.submitAndWait({
        TransactionType: "OfferCreate",
        Account: mm.address,
        // Market maker wants to SELL XRP: offers XRP, wants USD
        TakerPays: xrpAmount,
        TakerGets: { currency: "USD", issuer: RLUSD_ISSUER, value: usdAmount },
      }, { wallet: mm, autofill: true })
      console.log(`  → ${result.result.meta.TransactionResult}`)
    } catch (err) {
      console.log(`  → Failed: ${err.message}`)
    }
  }

  // Check the book
  const book = await client.request({
    command: "book_offers",
    taker_pays: { currency: "XRP" },
    taker_gets: { currency: "USD", issuer: RLUSD_ISSUER },
    limit: 5,
  })
  console.log(`\nOrder book depth: ${book.result.offers?.length || 0} offers`)

  // Also set trustline on watcher wallet if needed
  const WATCHER = "rJMcmkMxWYXae6wKy3iQVx6v9gN7p2BRFZ"
  console.log(`\nChecking watcher trustline for ${WATCHER}...`)
  try {
    const lines = await client.request({ command: "account_lines", account: WATCHER })
    const hasUsd = lines.result.lines?.some(l => l.currency === "USD" && l.account === RLUSD_ISSUER)
    if (hasUsd) {
      console.log("Watcher already has USD trustline ✓")
    } else {
      console.log("Watcher needs USD trustline — run watcher with WATCHER_SEED to set it up")
    }
  } catch {
    console.log("Could not check watcher account")
  }

  await client.disconnect()
  console.log("\nDone! DEX liquidity seeded.")
}

main().catch(console.error)
