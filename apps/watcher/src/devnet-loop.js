import { config } from "./config.js"
import { DcaScheduler } from "./dca-scheduler.js"

export class DevnetLoop {
  constructor(connections, orderCache, zkProver) {
    this.connections = connections
    this.orderCache = orderCache
    this.zkProver = zkProver
    this.dcaScheduler = new DcaScheduler()
    this.currentPrice = null
  }

  async start() {
    const client = this.connections.getClient()
    if (!client) throw new Error("DevNet client not connected")

    if (!config.rlusdIssuer) {
      console.error("[devnet-loop] RLUSD_ISSUER not set — price feed disabled, no orders will trigger")
    }

    client.on("ledgerClosed", () => this.onLedger())
    await client.request({ command: "subscribe", streams: ["ledger"] })
    console.log("[devnet-loop] Subscribed to ledger stream")

    await this.fetchPrice()
  }

  async fetchPrice() {
    const client = this.connections.getClient()
    if (!config.rlusdIssuer) return

    try {
      const askResp = await client.request({
        command: "book_offers",
        taker_pays: { currency: "XRP" },
        taker_gets: { currency: "USD", issuer: config.rlusdIssuer },
        limit: 1,
      })
      const bidResp = await client.request({
        command: "book_offers",
        taker_pays: { currency: "USD", issuer: config.rlusdIssuer },
        taker_gets: { currency: "XRP" },
        limit: 1,
      })

      let bestAsk = null
      let bestBid = null

      if (askResp.result.offers?.length > 0) {
        const o = askResp.result.offers[0]
        const pays = typeof o.TakerPays === "string" ? Number(o.TakerPays) / 1e6 : Number(o.TakerPays.value)
        const gets = typeof o.TakerGets === "string" ? Number(o.TakerGets) / 1e6 : Number(o.TakerGets.value)
        bestAsk = gets / pays
      }
      if (bidResp.result.offers?.length > 0) {
        const o = bidResp.result.offers[0]
        const pays = typeof o.TakerPays === "string" ? Number(o.TakerPays) / 1e6 : Number(o.TakerPays.value)
        const gets = typeof o.TakerGets === "string" ? Number(o.TakerGets) / 1e6 : Number(o.TakerGets.value)
        bestBid = pays / gets
      }

      this.currentPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk
    } catch (err) {
      console.error("[devnet-loop] Price fetch error:", err.message)
    }
  }

  async onLedger() {
    if (this._processing) return
    this._processing = true
    try {
      await this._processLedger()
    } finally {
      this._processing = false
    }
  }

  async _processLedger() {
    await this.fetchPrice()
    if (this.currentPrice === null) return

    const activeOrders = this.orderCache.getActiveOrders()
    for (const order of activeOrders) {
      if (order.orderType === "TRAILING_STOP") {
        if (order.side === "SELL") {
          if (this.currentPrice > order.highestPrice) {
            order.highestPrice = this.currentPrice
            order.computedTrigger = order.highestPrice * (1 - order.trailingPct / 10000)
          }
        } else {
          if (order.lowestPrice === 0 || this.currentPrice < order.lowestPrice) {
            order.lowestPrice = this.currentPrice
            order.computedTrigger = order.lowestPrice * (1 + order.trailingPct / 10000)
          }
        }
      }

      if (this.checkTrigger(order)) {
        const key = `${order.owner}:${order.escrowSequence}`
        this.orderCache.markTriggered(key)
        console.log(`[devnet-loop] TRIGGERED ${key} at price ${this.currentPrice}`)

        if (order.isPrivate) {
          await this.zkProver.executePrivateOrder(order, this.currentPrice)
        } else {
          await this.executePublicOrder(order)
        }
        this.orderCache.markExecuted(key)
      }
    }

    const dueSchedules = this.orderCache.getDueSchedules()
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    for (const schedule of dueSchedules) {
      await this.dcaScheduler.submitNext(schedule, client, wallet)
    }
  }

  checkTrigger(order) {
    const price = this.currentPrice
    switch (order.orderType) {
      case "STOP_LOSS":
        return order.side === "SELL" ? price <= order.triggerPrice : price >= order.triggerPrice
      case "TAKE_PROFIT":
        return order.side === "SELL" ? price >= order.triggerPrice : price <= order.triggerPrice
      case "TRAILING_STOP":
        if (order.side === "SELL") {
          return order.computedTrigger > 0 && price <= order.computedTrigger
        } else {
          return order.computedTrigger > 0 && price >= order.computedTrigger
        }
      case "OCO":
        if (order.side === "SELL") {
          return price >= order.tpPrice || price <= order.slPrice
        } else {
          return price <= order.tpPrice || price >= order.slPrice
        }
      default:
        return false
    }
  }

  async executePublicOrder(order) {
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!wallet) { console.error("[devnet-loop] No wallet for execution"); return }

    try {
      console.log(`[devnet-loop] EscrowFinish ${order.owner}:${order.escrowSequence}`)
      const finishTx = {
        TransactionType: "EscrowFinish",
        Account: wallet.address,
        Owner: order.owner,
        OfferSequence: order.escrowSequence,
        Condition: order.condition,
        Fulfillment: order.preimage,
      }
      const finishResult = await client.submitAndWait(finishTx, { wallet, autofill: true })
      console.log(`[devnet-loop] EscrowFinish: ${finishResult.result.meta.TransactionResult}`)

      const amountXrp = Number(order.amount) / 1e6
      const estimatedUsd = (amountXrp * this.currentPrice).toFixed(6)

      console.log(`[devnet-loop] OfferCreate (${order.side}) — ${amountXrp} XRP ≈ ${estimatedUsd} USD @ ${this.currentPrice}`)

      // Snapshot balances BEFORE trade to compute exact received amount
      const preUsdLines = await client.request({ command: "account_lines", account: wallet.address })
      const preUsd = Number(preUsdLines.result.lines?.find(l => l.currency === "USD" && l.account === config.rlusdIssuer)?.balance || 0)
      const preXrpInfo = await client.request({ command: "account_info", account: wallet.address })
      const preXrp = Number(preXrpInfo.result.account_data.Balance)

      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        Flags: 0x00020000, // tfImmediateOrCancel
      }
      if (order.side === "SELL") {
        offerTx.TakerGets = order.amount
        offerTx.TakerPays = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      } else {
        offerTx.TakerPays = order.amount
        offerTx.TakerGets = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      }
      const offerResult = await client.submitAndWait(offerTx, { wallet, autofill: true })
      console.log(`[devnet-loop] OfferCreate: ${offerResult.result.meta.TransactionResult}`)

      // Snapshot balances AFTER trade — send only the difference
      if (order.side === "SELL") {
        const postUsdLines = await client.request({ command: "account_lines", account: wallet.address })
        const postUsd = Number(postUsdLines.result.lines?.find(l => l.currency === "USD" && l.account === config.rlusdIssuer)?.balance || 0)
        const receivedUsd = postUsd - preUsd
        if (receivedUsd > 0) {
          const usdValue = receivedUsd.toFixed(6)
          console.log(`[devnet-loop] Payment → ${order.owner} (${usdValue} USD)`)
          const payTx = {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: order.owner,
            Amount: { currency: "USD", issuer: config.rlusdIssuer, value: usdValue },
          }
          const payResult = await client.submitAndWait(payTx, { wallet, autofill: true })
          console.log(`[devnet-loop] Payment: ${payResult.result.meta.TransactionResult}`)
        }
      } else {
        const postXrpInfo = await client.request({ command: "account_info", account: wallet.address })
        const postXrp = Number(postXrpInfo.result.account_data.Balance)
        const receivedXrp = Math.floor(postXrp - preXrp)
        if (receivedXrp > 0) {
          console.log(`[devnet-loop] Payment → ${order.owner} (${receivedXrp} drops XRP)`)
          const payTx = {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: order.owner,
            Amount: String(receivedXrp),
          }
          const payResult = await client.submitAndWait(payTx, { wallet, autofill: true })
          console.log(`[devnet-loop] Payment: ${payResult.result.meta.TransactionResult}`)
        }
      }
    } catch (err) {
      console.error(`[devnet-loop] Execution failed for ${order.owner}:${order.escrowSequence}:`, err.message)
    }
  }

  getPrice() {
    return this.currentPrice
  }
}
