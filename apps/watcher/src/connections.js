import { Client, Wallet } from "xrpl"
import { config } from "./config.js"

export class ConnectionManager {
  constructor() {
    this.client = null
    this.wallet = null
  }

  async connect() {
    this.client = new Client(config.devnet.wss, { connectionTimeout: 20000 })
    await this.client.connect()
    console.log(`[connections] Connected to ${config.devnet.wss}`)

    this.client.on("disconnected", async () => {
      console.log("[connections] Disconnected, reconnecting...")
      try { await this.client.connect() } catch (e) {
        console.error("[connections] Reconnect failed:", e.message)
      }
    })

    if (config.watcherSeed) {
      this.wallet = Wallet.fromSeed(config.watcherSeed)
      console.log(`[connections] Watcher wallet: ${this.wallet.address}`)

      // Ensure USD trustline exists (needed to receive USD from DEX trades)
      if (config.rlusdIssuer) {
        try {
          const lines = await this.client.request({ command: "account_lines", account: this.wallet.address })
          const hasUsd = lines.result.lines?.some(l => l.currency === "USD" && l.account === config.rlusdIssuer)
          if (!hasUsd) {
            console.log("[connections] Setting USD trustline...")
            await this.client.submitAndWait({
              TransactionType: "TrustSet",
              Account: this.wallet.address,
              LimitAmount: { currency: "USD", issuer: config.rlusdIssuer, value: "100000" },
            }, { wallet: this.wallet, autofill: true })
            console.log("[connections] USD trustline set ✓")
          }
        } catch (e) {
          console.warn("[connections] Could not set trustline:", e.message)
        }
      }
    } else {
      console.warn("[connections] No WATCHER_SEED — execution disabled")
    }
  }

  getClient() {
    return this.client
  }

  getWallet() {
    return this.wallet
  }

  async disconnect() {
    if (this.client?.isConnected()) {
      await this.client.disconnect()
      console.log("[connections] Disconnected")
    }
  }
}
