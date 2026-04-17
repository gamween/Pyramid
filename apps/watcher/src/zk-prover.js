import { execFileSync } from "child_process"
import { join } from "path"
import { config } from "./config.js"
import { getUsdBalance, getXrpBalance, sendProceeds } from "./trade-utils.js"

export class ZkProver {
  constructor(connections) {
    this.connections = connections
    this.cliPath = join(process.cwd(), "..", "..", "packages", "zkp", "target", "release", "cli")
  }

  async executePrivateOrder(order, currentPrice) {
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()

    if (!client) {
      console.error("[zk-prover] Not connected — cannot execute private order")
      return
    }
    if (!wallet) {
      console.error("[zk-prover] No wallet — cannot execute private order")
      return
    }

    try {
      console.log(`[zk-prover] Generating proof for ${order.owner}:${order.escrowSequence}`)
      const priceDrops = Math.floor(currentPrice * 1e6).toString()

      const proofOutput = execFileSync(this.cliPath, [
        "--trigger-price", order.triggerPrice.toString(),
        "--order-type", order.orderType === "STOP_LOSS" ? "0" : "1",
        "--nonce", order.nonce,
        "--current-price", priceDrops,
      ], { encoding: "utf-8", timeout: 300000 })

      const memos = JSON.parse(proofOutput)
      console.log(`[zk-prover] Proof generated (journal: ${memos[0].Memo.MemoData.length / 2} bytes, seal: ${memos[1].Memo.MemoData.length / 2} bytes)`)

      // EscrowFinish with ZK proof in Memos
      console.log(`[zk-prover] EscrowFinish with ZK proof`)
      const finishTx = {
        TransactionType: "EscrowFinish",
        Account: wallet.address,
        Owner: order.owner,
        OfferSequence: order.escrowSequence,
        Memos: memos,
      }
      const finishResult = await client.submitAndWait(finishTx, { wallet, autofill: true })
      console.log(`[zk-prover] EscrowFinish: ${finishResult.result.meta.TransactionResult}`)

      // Snapshot balances before trade
      const preUsd = await getUsdBalance(client, wallet.address)
      const preXrp = await getXrpBalance(client, wallet.address)

      // OfferCreate on DEX
      const amountXrp = Number(order.amount) / 1e6
      const estimatedUsd = (amountXrp * currentPrice).toFixed(6)
      console.log(`[zk-prover] OfferCreate on DEX (${order.side || "SELL"})`)
      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        Flags: 0x00020000,
      }
      if (order.side === "BUY") {
        offerTx.TakerPays = order.amount
        offerTx.TakerGets = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      } else {
        offerTx.TakerGets = order.amount
        offerTx.TakerPays = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      }
      const offerResult = await client.submitAndWait(offerTx, { wallet, autofill: true })
      console.log(`[zk-prover] OfferCreate: ${offerResult.result.meta.TransactionResult}`)

      // Payment back to user — send only the received difference
      await sendProceeds(client, wallet, {
        side: order.side || "SELL",
        destination: order.owner,
        preUsd,
        preXrp,
        logPrefix: "[zk-prover]",
      })

      console.log(`[zk-prover] Private order executed successfully`)
    } catch (err) {
      console.error(`[zk-prover] Execution failed:`, err.message)
    }
  }
}
