import { Client, Wallet } from "xrpl"
import { config } from "./config.js"

export class ConnectionManager {
  constructor() {
    this.clients = {}
    this.wallet = null
  }

  async connect() {
    this.clients.devnet = new Client(config.devnet.wss, { connectionTimeout: 20000 })
    await this.clients.devnet.connect()
    console.log("[connections] Connected to DevNet")

    this.clients.devnet.on("disconnected", async () => {
      console.log("[connections] DevNet disconnected, reconnecting...")
      try { await this.clients.devnet.connect() } catch (e) {
        console.error("[connections] DevNet reconnect failed:", e.message)
      }
    })

    try {
      const smartescrow = await import("xrpl-smartescrow")
      this.clients.groth5 = new smartescrow.Client(config.groth5.wss, { connectionTimeout: 20000 })
      await this.clients.groth5.connect()
      console.log("[connections] Connected to Groth5")

      this.clients.groth5.on("disconnected", async () => {
        console.log("[connections] Groth5 disconnected, reconnecting...")
        try { await this.clients.groth5.connect() } catch (e) {
          console.error("[connections] Groth5 reconnect failed:", e.message)
        }
      })
    } catch (err) {
      console.warn("[connections] Groth5 connection failed (ZK features disabled):", err.message)
      this.clients.groth5 = null
    }

    if (config.watcherSeed) {
      this.wallet = Wallet.fromSeed(config.watcherSeed)
      console.log(`[connections] Watcher wallet: ${this.wallet.address}`)
    } else {
      console.warn("[connections] No WATCHER_SEED — execution disabled")
    }
  }

  get(name) {
    return this.clients[name] || null
  }

  getWallet() {
    return this.wallet
  }

  async disconnect() {
    for (const [name, client] of Object.entries(this.clients)) {
      if (client?.isConnected()) {
        await client.disconnect()
        console.log(`[connections] Disconnected from ${name}`)
      }
    }
  }
}
