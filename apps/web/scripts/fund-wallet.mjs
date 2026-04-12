/**
 * Fund a specific wallet address with XRP from the devnet faucet.
 * Usage: node apps/web/scripts/fund-wallet.mjs <address> <amount>
 */
import { Client, Wallet } from "xrpl"

const WSS = "wss://wasm.devnet.rippletest.net:51233"
const FAUCET_HOST = "wasmfaucet.devnet.rippletest.net"
const TARGET = process.argv[2] || "rnDAnret9jc1zVwy8BeSn28c2ycBFm1zvy"
const AMOUNT = Number(process.argv[3] || 3000)

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log(`Connected. Funding ${TARGET} with ${AMOUNT} XRP...\n`)

  const temp = Wallet.generate()
  console.log(`Temp wallet: ${temp.address}`)

  const calls = Math.ceil(AMOUNT / 100) + 5 // extra for reserves/fees
  let balance = 0
  for (let i = 0; i < calls; i++) {
    try {
      const result = await client.fundWallet(temp, { faucetHost: FAUCET_HOST })
      balance = Number(result.balance)
      process.stdout.write(`\r  Faucet ${i + 1}/${calls}: ${balance} XRP`)
    } catch (e) {
      process.stdout.write(`\r  Faucet ${i + 1}/${calls}: failed, retrying...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  console.log()

  const sendAmount = Math.min(AMOUNT, balance - 15)
  console.log(`\nSending ${sendAmount} XRP to ${TARGET}...`)

  const tx = {
    TransactionType: "Payment",
    Account: temp.address,
    Destination: TARGET,
    Amount: String(Math.floor(sendAmount * 1_000_000)),
  }
  const result = await client.submitAndWait(tx, { wallet: temp })
  console.log(`Payment: ${result.result.meta.TransactionResult}`)

  await client.disconnect()
  console.log("Done!")
}

main().catch(console.error)
