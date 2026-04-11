# Backend Implementation Plan — Tellement-French

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete backend: validate DevNet, build watcher bot, build ZK proof workspace, and verify end-to-end.

**Architecture:** Bottom-up — Phase 1 validates DevNet works and fills addresses. Phase 2 builds the watcher bot (Express + ledger loop). Phase 3 builds the ZK Rust workspace. Phase 4 ties everything together. No frontend work — other devs handle that.

**Tech Stack:** Node.js (watcher), Rust (ZK/RISC0), xrpl.js v3 (DevNet), xrpl.js 4.5.0-smartescrow.4 (Groth5), Express, five-bells-condition, RISC0 zkVM 3.0.x

**Spec:** `docs/superpowers/specs/2026-04-11-backend-implementation-design.md`

---

## File Map

### Phase 1 — DevNet Validation
| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/scripts/setup-devnet.mjs` | Modify | Add watcher funding, write JSON output |
| `apps/web/lib/constants.js` | Modify | Fill ADDRESSES after script run |
| `apps/web/package.json` | Modify | Add five-bells-condition dep |

### Phase 2 — Watcher Bot
| File | Action | Responsibility |
|------|--------|---------------|
| `apps/watcher/package.json` | Create | Package manifest with deps |
| `apps/watcher/src/config.js` | Create | WSS URLs, env vars |
| `apps/watcher/src/connections.js` | Create | ConnectionManager (devnet + groth5) |
| `apps/watcher/src/order-cache.js` | Create | In-memory order + DCA store |
| `apps/watcher/src/dca-scheduler.js` | Create | Interval-based DCA submission |
| `apps/watcher/src/devnet-loop.js` | Create | Ledger subscription + trigger logic + execution |
| `apps/watcher/src/zk-prover.js` | Create | RISC0 proof gen + Groth5 EscrowFinish |
| `apps/watcher/src/index.js` | Create | Express API + startup |

### Phase 3 — ZK Layer
| File | Action | Responsibility |
|------|--------|---------------|
| `packages/zkp/Cargo.toml` | Create | Workspace root |
| `packages/zkp/justfile` | Create | Build/prove commands |
| `packages/zkp/zkvm/trigger-proof/Cargo.toml` | Create | Builder crate manifest |
| `packages/zkp/zkvm/trigger-proof/build.rs` | Create | risc0_build::embed_methods() |
| `packages/zkp/zkvm/trigger-proof/src/lib.rs` | Create | Re-export IMAGE_ID + ELF |
| `packages/zkp/zkvm/trigger-proof/guest/Cargo.toml` | Create | Guest crate (separate workspace) |
| `packages/zkp/zkvm/trigger-proof/guest/src/main.rs` | Create | Trigger price ZK proof logic |
| `packages/zkp/escrow/Cargo.toml` | Create | Escrow WASM crate |
| `packages/zkp/escrow/src/lib.rs` | Create | On-chain finish() verifier |
| `packages/zkp/cli/Cargo.toml` | Create | CLI prover crate |
| `packages/zkp/cli/src/main.rs` | Create | Local + Boundless proving |

---

## Phase 1: DevNet Validation

### Task 1: Update setup script — add watcher account + JSON output

**Files:**
- Modify: `apps/web/scripts/setup-devnet.mjs`

- [ ] **Step 1: Add watcher account funding and JSON output**

Add a third funded wallet for the watcher, and write all results to a JSON file:

```javascript
/**
 * T4.1 — Devnet Environment Setup
 *
 * Funds wallets, creates USD issuer, Vault, and LoanBroker on devnet.
 * Outputs addresses to devnet-addresses.json and console.
 *
 * Usage: node apps/web/scripts/setup-devnet.mjs
 */

import { Client, Wallet } from "xrpl"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const WSS = "wss://s.devnet.rippletest.net:51233"
const FAUCET = "https://faucet.devnet.rippletest.net/accounts"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function fundWallet(client, label) {
  console.log(`  Requesting faucet for ${label}...`)
  const resp = await fetch(FAUCET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!resp.ok) throw new Error(`Faucet failed: ${resp.status} ${resp.statusText}`)
  const data = await resp.json()
  const wallet = Wallet.fromSeed(data.account.secret)
  // Wait for account to be funded on ledger
  await new Promise((r) => setTimeout(r, 3000))
  const info = await client.request({ command: "account_info", account: wallet.address })
  console.log(`  Funded ${label}: ${wallet.address} (${info.result.account_data.Balance} drops)`)
  return { wallet, seed: data.account.secret }
}

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log("Connected to devnet\n")

  // 1. Fund protocol owner account
  console.log("1. Funding protocol owner...")
  const { wallet: owner, seed: ownerSeed } = await fundWallet(client, "owner")

  // 2. Fund RLUSD issuer account
  console.log("\n2. Funding RLUSD issuer...")
  const { wallet: issuer, seed: issuerSeed } = await fundWallet(client, "issuer")

  // 3. Fund watcher account
  console.log("\n3. Funding watcher...")
  const { wallet: watcher, seed: watcherSeed } = await fundWallet(client, "watcher")

  // 4. Set up trust line: owner trusts issuer for USD
  console.log("\n4. Setting up USD trust line...")
  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: owner.address,
    LimitAmount: {
      currency: "USD",
      issuer: issuer.address,
      value: "1000000",
    },
  }
  const trustResult = await client.submitAndWait(trustSetTx, { wallet: owner })
  console.log(`  TrustSet: ${trustResult.result.meta.TransactionResult}`)

  // 5. Watcher also needs USD trust line (to receive trade proceeds)
  console.log("\n5. Setting up watcher USD trust line...")
  const watcherTrustTx = {
    TransactionType: "TrustSet",
    Account: watcher.address,
    LimitAmount: {
      currency: "USD",
      issuer: issuer.address,
      value: "1000000",
    },
  }
  const watcherTrustResult = await client.submitAndWait(watcherTrustTx, { wallet: watcher })
  console.log(`  TrustSet: ${watcherTrustResult.result.meta.TransactionResult}`)

  // 6. Issue some test USD from issuer to owner
  console.log("\n6. Issuing test USD to owner...")
  const paymentTx = {
    TransactionType: "Payment",
    Account: issuer.address,
    Destination: owner.address,
    Amount: {
      currency: "USD",
      issuer: issuer.address,
      value: "100000",
    },
  }
  const payResult = await client.submitAndWait(paymentTx, { wallet: issuer })
  console.log(`  Payment: ${payResult.result.meta.TransactionResult}`)

  // 7. Create Vault
  console.log("\n7. Creating Vault...")
  let vaultId = null
  try {
    const vaultTx = {
      TransactionType: "VaultCreate",
      Account: owner.address,
      Asset: { currency: "XRP" },
    }
    const vaultResult = await client.submitAndWait(vaultTx, { wallet: owner })
    console.log(`  VaultCreate: ${vaultResult.result.meta.TransactionResult}`)

    const vaultNode = vaultResult.result.meta.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Vault"
    )
    vaultId = vaultNode?.CreatedNode?.LedgerIndex || null
    console.log(`  Vault ID: ${vaultId}`)
  } catch (err) {
    console.log(`  VaultCreate failed: ${err.message}`)
    console.log("  (XLS-65 may not be enabled on this devnet build)")
  }

  // 8. Create LoanBroker
  console.log("\n8. Creating LoanBroker...")
  let loanBrokerId = null
  if (vaultId) {
    try {
      const brokerTx = {
        TransactionType: "LoanBrokerSet",
        Account: owner.address,
        VaultID: vaultId,
        ManagementFeeRate: 1000,
      }
      const brokerResult = await client.submitAndWait(brokerTx, { wallet: owner })
      console.log(`  LoanBrokerSet: ${brokerResult.result.meta.TransactionResult}`)

      const brokerNode = brokerResult.result.meta.AffectedNodes?.find(
        (n) => n.CreatedNode?.LedgerEntryType === "LoanBroker"
      )
      loanBrokerId = brokerNode?.CreatedNode?.LedgerIndex || null
      console.log(`  LoanBroker ID: ${loanBrokerId}`)
    } catch (err) {
      console.log(`  LoanBrokerSet failed: ${err.message}`)
    }
  }

  // 9. Seed DEX with XRP/USD offers
  console.log("\n9. Seeding DEX with XRP/USD offers...")
  try {
    const sellOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: { currency: "USD", issuer: issuer.address, value: "2340" },
      TakerGets: "1000000000",
    }
    const sellResult = await client.submitAndWait(sellOffer, { wallet: owner })
    console.log(`  Sell offer: ${sellResult.result.meta.TransactionResult}`)

    const buyOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: "1000000000",
      TakerGets: { currency: "USD", issuer: issuer.address, value: "2300" },
    }
    const buyResult = await client.submitAndWait(buyOffer, { wallet: owner })
    console.log(`  Buy offer: ${buyResult.result.meta.TransactionResult}`)
  } catch (err) {
    console.log(`  DEX seeding failed: ${err.message}`)
  }

  await client.disconnect()

  // Write results to JSON
  const results = {
    timestamp: new Date().toISOString(),
    network: WSS,
    owner: { address: owner.address, seed: ownerSeed },
    issuer: { address: issuer.address, seed: issuerSeed },
    watcher: { address: watcher.address, seed: watcherSeed },
    vaultId: vaultId || "",
    loanBrokerId: loanBrokerId || "",
  }

  const outputPath = join(__dirname, "devnet-addresses.json")
  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResults written to: ${outputPath}`)

  // Console output
  console.log("\n" + "=".repeat(60))
  console.log("SETUP COMPLETE")
  console.log("=".repeat(60))
  console.log(`
Copy into apps/web/lib/constants.js:

export const WATCHER_ACCOUNT = "${watcher.address}"

export const ADDRESSES = {
  VAULT_ID: "${vaultId || ""}",
  LOAN_BROKER_ID: "${loanBrokerId || ""}",
  RLUSD_ISSUER: "${issuer.address}",
}

Copy into apps/watcher/.env:

WATCHER_SEED=${watcherSeed}

Owner seed (save for admin): ${ownerSeed}
Issuer seed (save for testing): ${issuerSeed}
`)
}

main().catch(console.error)
```

- [ ] **Step 2: Run the setup script**

Run: `node apps/web/scripts/setup-devnet.mjs`

Expected output:
- "Connected to devnet"
- Three funded wallets logged
- TrustSet: `tesSUCCESS` (×2)
- Payment: `tesSUCCESS`
- VaultCreate: `tesSUCCESS` (or "XLS-65 may not be enabled")
- LoanBrokerSet: `tesSUCCESS` (or skipped if VaultCreate failed)
- Sell/Buy offer: `tesSUCCESS`
- JSON file written

If VaultCreate fails with `temDISABLED`, note it — lending won't work but trading (escrow + DEX + tickets) will still work.

- [ ] **Step 3: Fill constants.js with output**

Copy the addresses from the script output into `apps/web/lib/constants.js`. Replace the empty strings with the actual values.

- [ ] **Step 4: Add five-bells-condition to frontend**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French && pnpm add five-bells-condition --filter web`

- [ ] **Step 5: Commit**

```bash
git add apps/web/scripts/setup-devnet.mjs apps/web/scripts/devnet-addresses.json apps/web/lib/constants.js apps/web/package.json pnpm-lock.yaml
git commit -m "chore: run devnet setup, fill ADDRESSES, add five-bells-condition"
```

---

## Phase 2: Watcher Bot

### Task 2: Watcher package + config

**Files:**
- Create: `apps/watcher/package.json`
- Create: `apps/watcher/src/config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tellement-french-watcher",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node src/index.js"
  },
  "dependencies": {
    "xrpl": "^3.0.0",
    "xrpl-smartescrow": "npm:xrpl@4.5.0-smartescrow.4",
    "express": "^4.18.0",
    "five-bells-condition": "^5.0.1"
  }
}
```

- [ ] **Step 2: Create config.js**

```javascript
export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://s.devnet.rippletest.net:51233",
  },
  groth5: {
    wss: process.env.GROTH5_WSS || "wss://groth5.devnet.rippletest.net:51233",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
}
```

- [ ] **Step 3: Install dependencies**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French && pnpm install --filter tellement-french-watcher`

- [ ] **Step 4: Commit**

```bash
git add apps/watcher/
git commit -m "feat: watcher package scaffold + config"
```

---

### Task 3: ConnectionManager

**Files:**
- Create: `apps/watcher/src/connections.js`

- [ ] **Step 1: Create connections.js**

```javascript
import { Client, Wallet } from "xrpl"
import { config } from "./config.js"

export class ConnectionManager {
  constructor() {
    this.clients = {}
    this.wallet = null
  }

  async connect() {
    // DevNet client (xrpl@^3.0.0)
    this.clients.devnet = new Client(config.devnet.wss, { connectionTimeout: 20000 })
    await this.clients.devnet.connect()
    console.log("[connections] Connected to DevNet")

    this.clients.devnet.on("disconnected", async () => {
      console.log("[connections] DevNet disconnected, reconnecting...")
      try { await this.clients.devnet.connect() } catch (e) {
        console.error("[connections] DevNet reconnect failed:", e.message)
      }
    })

    // Groth5 client (xrpl-smartescrow alias)
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

    // Watcher wallet (signs DevNet + Groth5 transactions)
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French/apps/watcher && node -e "import('./src/connections.js').then(() => console.log('OK'))"`

Expected: `OK` (no import errors)

- [ ] **Step 3: Commit**

```bash
git add apps/watcher/src/connections.js
git commit -m "feat: watcher ConnectionManager (devnet + groth5)"
```

---

### Task 4: OrderCache + DcaScheduler

**Files:**
- Create: `apps/watcher/src/order-cache.js`
- Create: `apps/watcher/src/dca-scheduler.js`

- [ ] **Step 1: Create order-cache.js**

```javascript
import { randomUUID } from "crypto"

export class OrderCache {
  constructor() {
    this.orders = new Map()
    this.dcaSchedules = new Map()
  }

  addOrder(params) {
    const key = `${params.owner}:${params.escrowSequence}`
    const order = {
      ...params,
      status: "ACTIVE",
      createdAt: Date.now(),
    }
    if (params.orderType === "TRAILING_STOP" && params.trailingPct) {
      order.highestPrice = 0
      order.computedTrigger = 0
    }
    this.orders.set(key, order)
    console.log(`[order-cache] Added order ${key} (${params.orderType} ${params.side})`)
    return key
  }

  addDca(params) {
    const id = params.id || randomUUID()
    const schedule = {
      id,
      signedBlobs: params.signedBlobs,
      intervalMs: params.intervalMs,
      nextSubmitTime: Date.now() + params.intervalMs,
      completed: 0,
      total: params.signedBlobs.length,
      status: "ACTIVE",
    }
    this.dcaSchedules.set(id, schedule)
    console.log(`[order-cache] Added DCA ${id} (${schedule.total} orders, ${params.intervalMs}ms interval)`)
    return id
  }

  getActiveOrders() {
    return [...this.orders.values()].filter((o) => o.status === "ACTIVE")
  }

  getDueSchedules() {
    const now = Date.now()
    return [...this.dcaSchedules.values()].filter(
      (s) => s.status === "ACTIVE" && s.completed < s.total && now >= s.nextSubmitTime
    )
  }

  markTriggered(key) {
    const order = this.orders.get(key)
    if (order) order.status = "TRIGGERED"
  }

  markExecuted(key) {
    const order = this.orders.get(key)
    if (order) order.status = "EXECUTED"
  }

  removeOrder(owner, sequence) {
    const key = `${owner}:${sequence}`
    return this.orders.delete(key)
  }

  getAll() {
    return {
      orders: Object.fromEntries(this.orders),
      dcaSchedules: Object.fromEntries(this.dcaSchedules),
    }
  }
}
```

- [ ] **Step 2: Create dca-scheduler.js**

```javascript
export class DcaScheduler {
  async submitNext(schedule, client) {
    if (schedule.completed >= schedule.total) return null

    const blob = schedule.signedBlobs[schedule.completed]
    try {
      const result = await client.submit(blob)
      console.log(`[dca] Submitted ${schedule.completed + 1}/${schedule.total}: ${result.result.engine_result}`)
      schedule.completed++
      schedule.nextSubmitTime = Date.now() + schedule.intervalMs
      if (schedule.completed >= schedule.total) {
        schedule.status = "COMPLETED"
        console.log(`[dca] Schedule ${schedule.id} completed`)
      }
      return result
    } catch (err) {
      console.error(`[dca] Submit failed for ${schedule.id}:`, err.message)
      return null
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/watcher/src/order-cache.js apps/watcher/src/dca-scheduler.js
git commit -m "feat: watcher OrderCache + DcaScheduler"
```

---

### Task 5: DevnetLoop — price monitoring + trigger evaluation + execution

**Files:**
- Create: `apps/watcher/src/devnet-loop.js`

- [ ] **Step 1: Create devnet-loop.js**

```javascript
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
    const client = this.connections.get("devnet")
    if (!client) throw new Error("DevNet client not connected")

    client.on("ledgerClosed", () => this.onLedger())
    await client.request({ command: "subscribe", streams: ["ledger"] })
    console.log("[devnet-loop] Subscribed to ledger stream")

    // Fetch initial price
    await this.fetchPrice()
  }

  async fetchPrice() {
    const client = this.connections.get("devnet")
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
    await this.fetchPrice()
    if (this.currentPrice === null) return

    // Check trigger conditions
    const activeOrders = this.orderCache.getActiveOrders()
    for (const order of activeOrders) {
      // Update trailing stop
      if (order.orderType === "TRAILING_STOP") {
        if (this.currentPrice > order.highestPrice) {
          order.highestPrice = this.currentPrice
          order.computedTrigger = order.highestPrice * (1 - order.trailingPct / 10000)
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

    // Check DCA schedules
    const dueSchedules = this.orderCache.getDueSchedules()
    const client = this.connections.get("devnet")
    for (const schedule of dueSchedules) {
      await this.dcaScheduler.submitNext(schedule, client)
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
        return order.computedTrigger > 0 && price <= order.computedTrigger
      default:
        return false
    }
  }

  async executePublicOrder(order) {
    const client = this.connections.get("devnet")
    const wallet = this.connections.getWallet()
    if (!wallet) { console.error("[devnet-loop] No wallet for execution"); return }

    try {
      // 1. EscrowFinish — release locked funds to watcher
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

      // 2. OfferCreate — trade on DEX (ImmediateOrCancel)
      console.log(`[devnet-loop] OfferCreate (${order.side})`)
      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        Flags: 0x00020000, // tfImmediateOrCancel
      }
      if (order.side === "SELL") {
        offerTx.TakerGets = order.amount // XRP in drops (from escrow)
        offerTx.TakerPays = { currency: "USD", issuer: config.rlusdIssuer, value: "999999" }
      } else {
        offerTx.TakerPays = order.amount
        offerTx.TakerGets = { currency: "USD", issuer: config.rlusdIssuer, value: "999999" }
      }
      const offerResult = await client.submitAndWait(offerTx, { wallet, autofill: true })
      console.log(`[devnet-loop] OfferCreate: ${offerResult.result.meta.TransactionResult}`)

      // 3. Payment — send proceeds back to order owner
      // Check watcher's balances to determine what to send
      const balances = await client.request({
        command: "account_lines",
        account: wallet.address,
      })
      const usdLine = balances.result.lines?.find(
        (l) => l.currency === "USD" && l.account === config.rlusdIssuer
      )
      if (usdLine && Number(usdLine.balance) > 0) {
        console.log(`[devnet-loop] Payment → ${order.owner} (${usdLine.balance} USD)`)
        const payTx = {
          TransactionType: "Payment",
          Account: wallet.address,
          Destination: order.owner,
          Amount: { currency: "USD", issuer: config.rlusdIssuer, value: usdLine.balance },
        }
        const payResult = await client.submitAndWait(payTx, { wallet, autofill: true })
        console.log(`[devnet-loop] Payment: ${payResult.result.meta.TransactionResult}`)
      }
    } catch (err) {
      console.error(`[devnet-loop] Execution failed for ${order.owner}:${order.escrowSequence}:`, err.message)
    }
  }

  getPrice() {
    return this.currentPrice
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/watcher/src/devnet-loop.js
git commit -m "feat: watcher DevnetLoop — price monitor + trigger + execution"
```

---

### Task 6: ZK Prover (Groth5 smart escrow execution)

**Files:**
- Create: `apps/watcher/src/zk-prover.js`

- [ ] **Step 1: Create zk-prover.js**

```javascript
import { execFileSync } from "child_process"
import { join } from "path"
import { config } from "./config.js"

export class ZkProver {
  constructor(connections) {
    this.connections = connections
    this.cliPath = join(process.cwd(), "..", "..", "packages", "zkp", "target", "release", "cli")
  }

  async executePrivateOrder(order, currentPrice) {
    const groth5 = this.connections.get("groth5")
    const wallet = this.connections.getWallet()

    if (!groth5) {
      console.error("[zk-prover] Groth5 not connected — cannot execute private order")
      return
    }
    if (!wallet) {
      console.error("[zk-prover] No wallet — cannot execute private order")
      return
    }

    try {
      // 1. Generate RISC0 Groth16 proof via CLI
      console.log(`[zk-prover] Generating proof for ${order.owner}:${order.escrowSequence}`)
      const priceDrops = Math.floor(currentPrice * 1e6).toString()

      const proofOutput = execFileSync(this.cliPath, [
        "--trigger-price", order.triggerPrice.toString(),
        "--order-type", order.orderType === "STOP_LOSS" ? "0" : "1",
        "--nonce", order.nonce,
        "--current-price", priceDrops,
      ], { encoding: "utf-8", timeout: 300000 }) // 5 min timeout for proving

      const memos = JSON.parse(proofOutput)
      console.log(`[zk-prover] Proof generated (journal: ${memos[0].Memo.MemoData.length / 2} bytes, seal: ${memos[1].Memo.MemoData.length / 2} bytes)`)

      // 2. EscrowFinish on Groth5 with proof in Memos + ComputationAllowance
      console.log(`[zk-prover] EscrowFinish on Groth5`)
      const finishTx = {
        TransactionType: "EscrowFinish",
        Account: wallet.address,
        Owner: order.owner,
        OfferSequence: order.escrowSequence,
        ComputationAllowance: 1000000,
        Memos: memos,
      }
      const finishResult = await groth5.submitAndWait(finishTx, { wallet, autofill: true })
      console.log(`[zk-prover] EscrowFinish: ${finishResult.result.meta.TransactionResult}`)

      // 3. OfferCreate on Groth5 DEX
      console.log(`[zk-prover] OfferCreate on Groth5 DEX`)
      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        Flags: 0x00020000, // tfImmediateOrCancel
        TakerGets: order.amount,
        TakerPays: { currency: "USD", issuer: config.rlusdIssuer, value: "999999" },
      }
      const offerResult = await groth5.submitAndWait(offerTx, { wallet, autofill: true })
      console.log(`[zk-prover] OfferCreate: ${offerResult.result.meta.TransactionResult}`)

      // 4. Payment back to user on Groth5
      const balances = await groth5.request({
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
        const payResult = await groth5.submitAndWait(payTx, { wallet, autofill: true })
        console.log(`[zk-prover] Payment: ${payResult.result.meta.TransactionResult}`)
      }

      console.log(`[zk-prover] Private order executed successfully`)
    } catch (err) {
      console.error(`[zk-prover] Execution failed:`, err.message)
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/watcher/src/zk-prover.js
git commit -m "feat: watcher ZkProver — RISC0 proof gen + Groth5 execution"
```

---

### Task 7: Express API + entry point

**Files:**
- Create: `apps/watcher/src/index.js`

- [ ] **Step 1: Create index.js**

```javascript
import express from "express"
import { ConnectionManager } from "./connections.js"
import { OrderCache } from "./order-cache.js"
import { DevnetLoop } from "./devnet-loop.js"
import { ZkProver } from "./zk-prover.js"
import { config } from "./config.js"

const app = express()
app.use(express.json())

const connections = new ConnectionManager()
const orderCache = new OrderCache()

// --- API Routes ---

app.post("/api/orders", (req, res) => {
  try {
    const key = orderCache.addOrder(req.body)
    res.json({ status: "ok", key })
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})

app.post("/api/dca", (req, res) => {
  try {
    const id = orderCache.addDca(req.body)
    res.json({ status: "ok", id })
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})

app.get("/api/orders", (req, res) => {
  res.json(orderCache.getAll())
})

app.delete("/api/orders/:owner/:sequence", (req, res) => {
  const removed = orderCache.removeOrder(req.params.owner, parseInt(req.params.sequence, 10))
  res.json({ status: removed ? "ok" : "not_found" })
})

app.get("/api/health", (req, res) => {
  res.json({
    devnet: connections.get("devnet")?.isConnected() || false,
    groth5: connections.get("groth5")?.isConnected() || false,
    wallet: connections.getWallet()?.address || null,
    activeOrders: orderCache.getActiveOrders().length,
    price: devnetLoop?.getPrice() || null,
  })
})

// --- Startup ---

let devnetLoop = null

async function main() {
  await connections.connect()

  const zkProver = new ZkProver(connections)
  devnetLoop = new DevnetLoop(connections, orderCache, zkProver)
  await devnetLoop.start()

  app.listen(config.port, () => {
    console.log(`[watcher] HTTP API on port ${config.port}`)
    console.log(`[watcher] Ready — monitoring DevNet prices`)
  })
}

main().catch((err) => {
  console.error("[watcher] Fatal:", err)
  process.exit(1)
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[watcher] Shutting down...")
  await connections.disconnect()
  process.exit(0)
})
```

- [ ] **Step 2: Create watcher .env file**

Create `apps/watcher/.env` with the watcher seed from Phase 1:

```
WATCHER_SEED=<seed from setup script>
RLUSD_ISSUER=<issuer address from setup script>
```

- [ ] **Step 3: Test the watcher starts**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French/apps/watcher && node --env-file=.env src/index.js`

Expected output:
```
[connections] Connected to DevNet
[connections] Connected to Groth5 (or warning if unavailable)
[connections] Watcher wallet: rXXXXXX
[devnet-loop] Subscribed to ledger stream
[watcher] HTTP API on port 3001
[watcher] Ready — monitoring DevNet prices
```

- [ ] **Step 4: Test health endpoint**

Run (in another terminal): `curl http://localhost:3001/api/health`

Expected: `{"devnet":true,"groth5":...,"wallet":"rXXXX","activeOrders":0,"price":...}`

- [ ] **Step 5: Test order registration**

Run:
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"owner":"rTest","escrowSequence":1,"triggerPrice":2.0,"orderType":"STOP_LOSS","side":"SELL","fulfillment":"A0022000...","condition":"A025...","amount":"500000000"}'
```

Expected: `{"status":"ok","key":"rTest:1"}`

Then: `curl http://localhost:3001/api/orders`

Expected: shows the order in the response.

- [ ] **Step 6: Add .env to .gitignore**

Append to the project `.gitignore`:
```
apps/watcher/.env
apps/web/scripts/devnet-addresses.json
```

- [ ] **Step 7: Commit**

```bash
git add apps/watcher/src/index.js apps/watcher/.env.example .gitignore
git commit -m "feat: watcher Express API + entry point"
```

Create `apps/watcher/.env.example`:
```
WATCHER_SEED=
RLUSD_ISSUER=
```

---

## Phase 3: ZK Layer

### Task 8: Rust workspace scaffold

**Files:**
- Create: `packages/zkp/Cargo.toml`
- Create: `packages/zkp/justfile`

- [ ] **Step 1: Create workspace Cargo.toml**

```toml
[package]
name = "tellement-french-zkp"
version = "0.1.0"
edition = "2024"

[workspace]
resolver = "2"
members = ["zkvm/trigger-proof", "escrow", "cli"]

[workspace.dependencies]
anyhow = "1"
bytemuck = "1.25.0"
serde = { version = "1.0", features = ["derive", "std"] }
serde_json = "1"
risc0-verifier-xrpl-wasm = { version = "0.1", default-features = false }
xrpl-wasm-stdlib = "0.8"

[profile.dev]
opt-level = 3

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
strip = true
panic = "abort"
```

- [ ] **Step 2: Create justfile**

```just
# Install the wasm32v1-none target
setup:
    rustup target add wasm32v1-none

# Build the zkVM guest program (via build.rs)
build-guest:
    cargo build -p trigger-proof-builder

# Build the escrow Wasm smart contract
build-escrow:
    cargo build -p escrow --release --target wasm32v1-none

# Build everything (guest + escrow)
build: build-guest build-escrow

# Run the CLI prover
prove *args:
    cargo run -p cli -- {{ args }}

# Clean all build artifacts
clean:
    cargo clean
```

- [ ] **Step 3: Commit**

```bash
git add packages/zkp/Cargo.toml packages/zkp/justfile
git commit -m "feat: ZK workspace scaffold"
```

---

### Task 9: Guest program — trigger price proof

**Files:**
- Create: `packages/zkp/zkvm/trigger-proof/Cargo.toml`
- Create: `packages/zkp/zkvm/trigger-proof/build.rs`
- Create: `packages/zkp/zkvm/trigger-proof/src/lib.rs`
- Create: `packages/zkp/zkvm/trigger-proof/guest/Cargo.toml`
- Create: `packages/zkp/zkvm/trigger-proof/guest/src/main.rs`

- [ ] **Step 1: Create builder crate Cargo.toml**

```toml
[package]
name = "trigger-proof-builder"
version = "0.1.0"
edition = "2024"

[build-dependencies]
risc0-build = { version = "^3.0.3" }

[package.metadata.risc0]
methods = ["guest"]
```

- [ ] **Step 2: Create build.rs**

```rust
fn main() {
    risc0_build::embed_methods();
}
```

- [ ] **Step 3: Create src/lib.rs**

```rust
#![no_std]
use core::{concat, env, include, include_bytes};

include!(concat!(env!("OUT_DIR"), "/methods.rs"));
```

- [ ] **Step 4: Create guest/Cargo.toml**

```toml
[package]
name = "trigger-proof"
version = "0.1.0"
edition = "2024"

[workspace]

[dependencies]
risc0-zkvm = { version = "3.0.3", default-features = false, features = ["std"] }
sha2 = { version = "0.10", default-features = false }
```

- [ ] **Step 5: Create guest/src/main.rs**

```rust
use risc0_zkvm::guest::env;
use sha2::{Sha256, Digest};

fn main() {
    // Read private inputs from the prover
    let trigger_price: u64 = env::read();
    let order_type: u8 = env::read();   // 0 = STOP_LOSS, 1 = TAKE_PROFIT
    let nonce: [u8; 32] = env::read();
    let current_price: u64 = env::read();

    // Compute commitment: SHA256(trigger_price || order_type || nonce)
    let mut hasher = Sha256::new();
    hasher.update(trigger_price.to_be_bytes());
    hasher.update([order_type]);
    hasher.update(nonce);
    let commitment: [u8; 32] = hasher.finalize().into();

    // Validate trigger condition
    match order_type {
        0 => assert!(current_price <= trigger_price, "SL: price not at or below trigger"),
        1 => assert!(current_price >= trigger_price, "TP: price not at or above trigger"),
        _ => panic!("invalid order type"),
    }

    // Public output: commitment (32 bytes) + current_price (8 bytes) = 40 bytes
    env::commit_slice(&commitment);
    env::commit_slice(&current_price.to_be_bytes());
}
```

- [ ] **Step 6: Create directory structure and verify**

Run:
```bash
cd /Users/fianso/Development/hackathons/Tellement-French/packages/zkp
mkdir -p zkvm/trigger-proof/guest/src zkvm/trigger-proof/src
```

Then run: `just setup && just build-guest`

Expected: compiles the guest ELF and generates `TRIGGER_PROOF_ID` + `TRIGGER_PROOF_ELF` constants.

- [ ] **Step 7: Commit**

```bash
git add packages/zkp/zkvm/
git commit -m "feat: ZK guest program — trigger price proof"
```

---

### Task 10: Escrow WASM — on-chain proof verifier

**Files:**
- Create: `packages/zkp/escrow/Cargo.toml`
- Create: `packages/zkp/escrow/src/lib.rs`

- [ ] **Step 1: Create escrow/Cargo.toml**

```toml
[package]
name = "escrow"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
bytemuck = { workspace = true }
risc0-verifier-xrpl-wasm = { workspace = true }
xrpl-wasm-stdlib = { workspace = true }
trigger-proof-builder = { path = "../zkvm/trigger-proof" }
```

- [ ] **Step 2: Create escrow/src/lib.rs**

```rust
#![no_std]
#![no_main]

use risc0_verifier_xrpl_wasm::{Proof, risc0};
use xrpl_wasm_stdlib::host::get_tx_nested_field;
use trigger_proof_builder::TRIGGER_PROOF_ID;

// Journal = 40 bytes (32-byte commitment + 8-byte current_price)
const JOURNAL_LEN: usize = 40;
// Seal = 256 bytes (Groth16 proof on BN254)
const SEAL_LEN: usize = 256;

/// Read a memo's MemoData from the EscrowFinish transaction.
/// Memo layout: Memos -> [index] -> Memo -> MemoData
fn get_memo<const LEN: usize>(idx: i32) -> Option<[u8; LEN]> {
    let mut buf = [0u8; LEN];
    // Use xrpl-wasm-stdlib to navigate: Memos[idx].Memo.MemoData
    let locator = xrpl_wasm_stdlib::locator::Locator::new()
        .field(xrpl_wasm_stdlib::sfield::MEMOS)
        .index(idx)
        .field(xrpl_wasm_stdlib::sfield::MEMO)
        .field(xrpl_wasm_stdlib::sfield::MEMO_DATA);

    let len = get_tx_nested_field(locator.as_ptr(), buf.as_mut_ptr(), LEN as i32);
    if len == LEN as i32 { Some(buf) } else { None }
}

#[unsafe(no_mangle)]
pub extern "C" fn finish() -> i32 {
    // Read journal (40 bytes) and seal (256 bytes) from EscrowFinish Memos
    let journal: [u8; JOURNAL_LEN] = match get_memo(0) {
        Some(j) => j,
        None => return 0, // missing journal → don't release
    };
    let seal: [u8; SEAL_LEN] = match get_memo(1) {
        Some(s) => s,
        None => return 0, // missing seal → don't release
    };

    // Verify RISC0 proof: seal was generated by our guest program (bound by IMAGE_ID)
    let proof = match Proof::from_seal_bytes(&seal) {
        Ok(p) => p,
        Err(_) => return 0,
    };
    let journal_digest = risc0::hash_journal(&journal);
    if risc0::verify(&proof, &bytemuck::cast(TRIGGER_PROOF_ID), &journal_digest).is_err() {
        return 0;
    }

    // Proof valid — the guest verified:
    // 1. commitment = sha256(trigger_price || order_type || nonce)
    // 2. price condition was met (SL or TP)
    // The commitment in the journal can be checked off-chain against what was expected.
    1 // release funds
}
```

Note: The `get_memo` helper uses the `Locator` API from `xrpl-wasm-stdlib`. The exact API may differ from the starter — check `xrpl-wasm-stdlib` 0.8 docs. The starter's `get_memo` implementation is the reference.

- [ ] **Step 3: Build the escrow WASM**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French/packages/zkp && just build-escrow`

Expected: `target/wasm32v1-none/release/escrow.wasm` is created.

- [ ] **Step 4: Commit**

```bash
git add packages/zkp/escrow/
git commit -m "feat: ZK escrow WASM — on-chain proof verifier"
```

---

### Task 11: CLI prover

**Files:**
- Create: `packages/zkp/cli/Cargo.toml`
- Create: `packages/zkp/cli/src/main.rs`

- [ ] **Step 1: Create cli/Cargo.toml**

```toml
[package]
name = "cli"
version = "0.1.0"
edition = "2024"

[dependencies]
anyhow = { workspace = true }
bytemuck = { workspace = true }
clap = { version = "4", features = ["derive"] }
hex = "0.4"
risc0-zkvm = { version = "3.0.4", features = ["prove"] }
trigger-proof-builder = { path = "../zkvm/trigger-proof" }
serde_json = { workspace = true }
risc0-verifier-xrpl-wasm = { workspace = true, features = ["std"] }
```

- [ ] **Step 2: Create cli/src/main.rs**

```rust
use anyhow::{Context, Result};
use clap::Parser;
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts};
use risc0_verifier_xrpl_wasm::risc0::encode_seal;
use trigger_proof_builder::TRIGGER_PROOF_ELF;

#[derive(Parser)]
#[command(name = "tf-prover", about = "Generate ZK proofs for trigger price conditions")]
struct Args {
    /// Trigger price in drops (e.g., 2000000 = $2.00)
    #[arg(long)]
    trigger_price: u64,

    /// Order type: 0 = STOP_LOSS, 1 = TAKE_PROFIT
    #[arg(long)]
    order_type: u8,

    /// Nonce as hex string (64 hex chars = 32 bytes)
    #[arg(long)]
    nonce: String,

    /// Current price in drops
    #[arg(long)]
    current_price: u64,
}

fn main() -> Result<()> {
    let args = Args::parse();

    let nonce_bytes: [u8; 32] = hex::decode(&args.nonce)
        .context("nonce must be 64 hex chars")?
        .try_into()
        .map_err(|_| anyhow::anyhow!("nonce must be exactly 32 bytes"))?;

    eprintln!("[tf-prover] Building proof...");
    eprintln!("  trigger_price: {}", args.trigger_price);
    eprintln!("  order_type: {} ({})", args.order_type, if args.order_type == 0 { "STOP_LOSS" } else { "TAKE_PROFIT" });
    eprintln!("  current_price: {}", args.current_price);

    let env = ExecutorEnv::builder()
        .write(&args.trigger_price)?
        .write(&args.order_type)?
        .write(&nonce_bytes)?
        .write(&args.current_price)?
        .build()?;

    let receipt = default_prover()
        .prove_with_opts(env, TRIGGER_PROOF_ELF, &ProverOpts::groth16())
        .context("proving failed")?
        .receipt;

    let journal = receipt.journal.bytes.as_slice().to_vec();
    let seal = encode_seal(&receipt).context("seal encoding failed")?;

    eprintln!("[tf-prover] Proof generated (journal: {} bytes, seal: {} bytes)", journal.len(), seal.len());

    // Output: JSON memo array for EscrowFinish
    let memos = serde_json::json!([
        { "Memo": { "MemoData": hex::encode(&journal) } },
        { "Memo": { "MemoData": hex::encode(&seal) } }
    ]);

    println!("{}", serde_json::to_string(&memos)?);
    Ok(())
}
```

- [ ] **Step 3: Build the full workspace**

Run: `cd /Users/fianso/Development/hackathons/Tellement-French/packages/zkp && just build`

Expected: both guest and escrow compile. Then:

Run: `cargo build -p cli --release`

Expected: `target/release/cli` binary is created.

- [ ] **Step 4: Commit**

```bash
git add packages/zkp/cli/
git commit -m "feat: ZK CLI prover — local Groth16 proof generation"
```

---

## Phase 4: Integration

### Task 12: End-to-end verification

- [ ] **Step 1: Verify DevNet setup**

Run: `node apps/web/scripts/setup-devnet.mjs`

Check: All transactions return `tesSUCCESS`. Constants are filled.

- [ ] **Step 2: Start the watcher**

Run: `cd apps/watcher && node --env-file=.env src/index.js`

Check: connects to DevNet, subscribes to ledger, logs prices.

- [ ] **Step 3: Test order registration via curl**

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"owner":"rOwnerAddr","escrowSequence":42,"triggerPrice":2.0,"orderType":"STOP_LOSS","side":"SELL","preimage":"A002...","condition":"A025...","amount":"500000000"}'
```

Check: `{"status":"ok","key":"rOwnerAddr:42"}`

- [ ] **Step 4: Test health endpoint**

Run: `curl http://localhost:3001/api/health`

Check: shows connected status, price, active orders count.

- [ ] **Step 5: Build ZK workspace**

Run: `cd packages/zkp && just setup && just build`

Check: `target/wasm32v1-none/release/escrow.wasm` exists.

- [ ] **Step 6: Test proof generation**

Run:
```bash
cd packages/zkp && cargo run -p cli -- \
  --trigger-price 2000000 \
  --order-type 0 \
  --nonce $(openssl rand -hex 32) \
  --current-price 1900000
```

Check: outputs JSON memo array with journal + seal hex. First run may take a while (downloads ~1GB Docker image).

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: integration verification complete"
```
