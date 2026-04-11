import { execFileSync } from "child_process"
import { join } from "path"
import { config } from "./config.js"

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

      // EscrowFinish with ZK proof in Memos + ComputationAllowance
      console.log(`[zk-prover] EscrowFinish with ZK proof`)
      const finishTx = {
        TransactionType: "EscrowFinish",
        Account: wallet.address,
        Owner: order.owner,
        OfferSequence: order.escrowSequence,
        ComputationAllowance: 1000000,
        Memos: memos,
      }
      const finishResult = await client.submitAndWait(finishTx, { wallet, autofill: true })
      console.log(`[zk-prover] EscrowFinish: ${finishResult.result.meta.TransactionResult}`)

      // OfferCreate on DEX
      console.log(`[zk-prover] OfferCreate on DEX`)
      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        Flags: 0x00020000,
        TakerGets: order.amount,
        TakerPays: { currency: "USD", issuer: config.rlusdIssuer, value: "999999" },
      }
      const offerResult = await client.submitAndWait(offerTx, { wallet, autofill: true })
      console.log(`[zk-prover] OfferCreate: ${offerResult.result.meta.TransactionResult}`)

      // Payment back to user
      const balances = await client.request({
        command: "account_lines",
        account: wallet.address,
      })
      const usdLine = balances.result.lines?.find(
        (l) => l.currency === "USD" && l.account === config.rlusdIssuer
      )
      if (usdLine && Number(usdLine.balance) > 0) {
        const payTx = {
          TransactionType: "Payment",
          Account: wallet.address,
          Destination: order.owner,
          Amount: { currency: "USD", issuer: config.rlusdIssuer, value: usdLine.balance },
        }
        const payResult = await client.submitAndWait(payTx, { wallet, autofill: true })
        console.log(`[zk-prover] Payment: ${payResult.result.meta.TransactionResult}`)
      }

      console.log(`[zk-prover] Private order executed successfully`)
    } catch (err) {
      console.error(`[zk-prover] Execution failed:`, err.message)
    }
  }
}
