# Browser Cosign & Loans Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable full browser-side XLS-66 loan operations with real cosigning via the watcher bot, and build a loans marketplace UI.

**Architecture:** Native signing service using `ripple-binary-codec`/`ripple-keypairs` (via the `xrpl` package's re-exports). Browser builds and auto-fills XLS-66 txs, sends to watcher bot for cosigning (LoanSet) or signs directly (LoanPay/LoanManage/LoanDelete). Watcher bot exposes a cosign HTTP endpoint. Next.js API routes relay between browser and watcher bot. Marketplace UI shows available vaults and active loans.

**Tech Stack:** xrpl@4.5.0-smartescrow.4 (`encode`, `encodeForSigning`), ripple-keypairs (server-side via bundled path), Next.js API routes, Express (watcher bot), React hooks, Tailwind/shadcn-ui.

---

### Task 1: Native Transaction Signing Service

**Files:**
- Create: `apps/web/lib/xrpl-signing.js`

This is the foundational utility. It uses `encode` and `encodeForSigning` from the `xrpl` package (which delegates to `ripple-binary-codec` internally). On the server side (watcher bot), it also uses `ripple-keypairs` for raw signing. All functions are type-agnostic — they work with any XRPL transaction type the codec can encode, including all XLS-66 types.

- [ ] **Step 1: Create the signing service**

Create `apps/web/lib/xrpl-signing.js`:

```js
/**
 * Native Transaction Signing Service
 *
 * Uses ripple-binary-codec (via xrpl package re-exports) directly.
 * Type-agnostic: works with any XRPL transaction type the codec supports,
 * including XLS-65/66 (Vaults, Loans) and future amendments.
 *
 * Browser: autofill + encode + submit (wallet handles signing)
 * Server:  autofill + encode + sign + submit (ripple-keypairs)
 */

import { encode, encodeForSigning } from "xrpl"
import { DEFAULT_NETWORK } from "./networks"

/**
 * Auto-fill required transaction fields from the ledger.
 * @param {import("xrpl").Client} client - Connected XRPL client
 * @param {object} tx - Transaction JSON (must have Account)
 * @param {object} [opts] - Options
 * @param {number} [opts.signerCount=1] - Number of signers (affects Fee)
 * @param {string} [opts.signingPubKey] - SigningPubKey to set
 * @returns {Promise<object>} - Tx with Sequence, Fee, LastLedgerSequence, NetworkID filled
 */
export async function autofill(client, tx, opts = {}) {
  const { signerCount = 1, signingPubKey } = opts
  const [acctInfo, ledgerInfo] = await Promise.all([
    client.request({ command: "account_info", account: tx.Account }),
    client.request({ command: "ledger_current" }),
  ])
  return {
    ...tx,
    Fee: String(12 * signerCount),
    Sequence: acctInfo.result.account_data.Sequence,
    LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
    NetworkID: DEFAULT_NETWORK.networkId,
    ...(signingPubKey !== undefined ? { SigningPubKey: signingPubKey } : {}),
  }
}

/**
 * Get the signing data for a transaction (the hash to sign).
 * Uses ripple-binary-codec's encodeForSigning which prepends the 0x53545800 prefix.
 * @param {object} tx - Fully prepared transaction JSON
 * @returns {string} - Hex-encoded signing data
 */
export function getSigningData(tx) {
  return encodeForSigning(tx)
}

/**
 * Encode a signed transaction into a binary blob for submission.
 * @param {object} tx - Transaction JSON with TxnSignature (and optionally CounterpartySignature)
 * @returns {string} - Hex-encoded tx_blob
 */
export function encodeTransaction(tx) {
  return encode(tx)
}

/**
 * Submit a tx_blob and wait for validation.
 * @param {import("xrpl").Client} client - Connected XRPL client
 * @param {string} tx_blob - Hex-encoded signed transaction
 * @returns {Promise<object>} - Validated transaction result
 */
export async function submitAndWait(client, tx_blob) {
  const result = await client.request({ command: "submit", tx_blob })
  if (result.result.engine_result !== "tesSUCCESS") {
    throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
  }
  const txHash = result.result.tx_json?.hash
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const txResult = await client.request({ command: "tx", transaction: txHash })
      if (txResult.result.validated) return txResult.result
    } catch {}
  }
  const txResult = await client.request({ command: "tx", transaction: txHash })
  return txResult.result
}

/**
 * Assemble a cosigned LoanSet transaction (XLS-66).
 * Broker is tx.Account (signs with TxnSignature).
 * Borrower is Counterparty (signs with CounterpartySignature).
 * @param {object} tx - Prepared LoanSet tx (with SigningPubKey = broker pubkey)
 * @param {string} brokerSignature - Broker's TxnSignature hex
 * @param {string} borrowerSignature - Borrower's signature hex
 * @param {string} borrowerPubKey - Borrower's public key hex
 * @returns {string} - Encoded tx_blob ready for submission
 */
export function assembleCosigned(tx, brokerSignature, borrowerSignature, borrowerPubKey) {
  const cosigned = {
    ...tx,
    TxnSignature: brokerSignature,
    CounterpartySignature: {
      SigningPubKey: borrowerPubKey,
      TxnSignature: borrowerSignature,
    },
  }
  return encode(cosigned)
}

/**
 * Extract a created ledger entry ID from transaction metadata.
 * @param {object} txResult - Validated transaction result (with meta)
 * @param {string} entryType - LedgerEntryType to find (e.g., "Loan", "LoanBroker", "Vault")
 * @returns {string|null} - LedgerIndex of the created entry, or null
 */
export function extractCreatedId(txResult, entryType) {
  return txResult.meta?.AffectedNodes?.find(
    (n) => n.CreatedNode?.LedgerEntryType === entryType
  )?.CreatedNode?.LedgerIndex || null
}
```

- [ ] **Step 2: Verify the service compiles**

Run: `cd apps/web && npx next lint --file lib/xrpl-signing.js 2>&1 | head -20`

Check for import errors. The `encode` and `encodeForSigning` are named exports from the `xrpl` package (confirmed in `setup-devnet.mjs` line 10).

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/xrpl-signing.js
git commit -m "feat: add native transaction signing service (xrpl-signing.js)"
```

---

### Task 2: Watcher Bot Cosign Handler

**Files:**
- Create: `apps/watcher/src/cosign-handler.js`
- Modify: `apps/watcher/src/index.js`
- Modify: `apps/watcher/src/config.js`

The watcher bot already runs Express on port 3001 (see `apps/watcher/src/index.js`). We add a cosign endpoint that receives a borrower's loan request, validates it, cosigns as broker, and submits to XRPL.

- [ ] **Step 1: Update watcher config with vault management data**

Edit `apps/watcher/src/config.js` to add vault/broker IDs the watcher manages:

```js
export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://wasm.devnet.rippletest.net:51233",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
  // Vaults the watcher manages as loan broker
  managedVaults: {
    "8A84591D49EF8D1A25ABF2CE1E28DE5AA8899484392EFEDE84FA3304E109C62E": {
      loanBrokerId: "356E1FF36205377B8C6074489708A9B602CCB349A910305F25CC57AE7A930432",
      name: "Fresh Vault",
    },
    "6087666E82509EFA5922ED57E87E647A78063378686195620F6445B0D36C66E2": {
      loanBrokerId: null, // will be populated from devnet-addresses.json or env
      name: "Active Lending",
    },
    "AD7E1DB393F73284E52F90C8B960FB8FC051399521E7FC9BAE30FFCBA53C8A44": {
      loanBrokerId: null,
      name: "Yield Earned",
    },
  },
}
```

**Note:** The first vault's loanBrokerId comes from `ADDRESSES.LOAN_BROKER_ID` in `apps/web/lib/constants.js`. During implementation, check `apps/web/scripts/devnet-addresses.json` (created by setup-devnet.mjs) for the actual IDs and populate all entries.

- [ ] **Step 2: Create the cosign handler**

Create `apps/watcher/src/cosign-handler.js`:

```js
/**
 * Cosign Handler — Broker-side LoanSet cosigning
 *
 * Receives a borrower's loan request, validates it, builds the LoanSet tx,
 * cosigns as broker (vault owner), and submits to XRPL.
 *
 * Two-phase flow:
 * Phase 1 (POST /api/loans/prepare): Build and return the prepared tx for borrower to sign
 * Phase 2 (POST /api/loans/cosign): Receive borrower signature, cosign as broker, submit
 */

import { encode, encodeForSigning } from "xrpl"
import { config } from "./config.js"

// Dynamic import for ripple-keypairs (bundled with xrpl)
let rawSign = null
async function loadRawSign() {
  if (rawSign) return rawSign
  // ripple-keypairs is bundled inside xrpl — import from the resolved path
  const keypairs = await import("ripple-keypairs")
  rawSign = keypairs.sign || keypairs.default?.sign
  if (!rawSign) {
    // Fallback: try the pnpm-resolved path
    const { sign } = await import("xrpl/node_modules/ripple-keypairs/dist/index.js")
    rawSign = sign
  }
  return rawSign
}

export class CosignHandler {
  constructor(connections) {
    this.connections = connections
  }

  /**
   * Phase 1: Prepare a LoanSet tx for the borrower to sign.
   * Returns the fully prepared tx JSON (with auto-filled fields).
   */
  async prepareLoanTx({ vaultId, borrowerAddress, principalDrops, interestRate, paymentTotal, paymentInterval, gracePeriod }) {
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!client || !wallet) throw new Error("Watcher not connected")

    // Validate vault is managed by this watcher
    const vaultConfig = config.managedVaults[vaultId]
    if (!vaultConfig) throw new Error(`Vault ${vaultId} not managed by this watcher`)
    if (!vaultConfig.loanBrokerId) throw new Error(`Vault ${vaultId} has no loan broker configured`)

    // Check vault has sufficient liquidity
    const vaultInfo = await client.request({ command: "ledger_entry", index: vaultId })
    const vaultData = vaultInfo.result.node
    const available = parseInt(vaultData.Asset || "0", 10)
    if (available < principalDrops) {
      throw new Error(`Insufficient vault liquidity: ${available} < ${principalDrops}`)
    }

    // Auto-fill the LoanSet tx
    const acctInfo = await client.request({ command: "account_info", account: wallet.address })
    const ledgerInfo = await client.request({ command: "ledger_current" })

    const prepared = {
      TransactionType: "LoanSet",
      Account: wallet.address,
      LoanBrokerID: vaultConfig.loanBrokerId,
      Counterparty: borrowerAddress,
      PrincipalRequested: String(principalDrops),
      InterestRate: interestRate || 500,
      PaymentTotal: paymentTotal || 12,
      PaymentInterval: paymentInterval || 2592000,
      GracePeriod: gracePeriod || 604800,
      Fee: "24", // 12 per signer * 2 signers
      Sequence: acctInfo.result.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
      NetworkID: 2002,
      SigningPubKey: wallet.publicKey,
    }

    return prepared
  }

  /**
   * Phase 2: Cosign a prepared LoanSet tx.
   * Receives the borrower's signature, adds broker signature, submits.
   */
  async cosignAndSubmit({ preparedTx, borrowerSignature, borrowerPubKey }) {
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!client || !wallet) throw new Error("Watcher not connected")

    const sign = await loadRawSign()

    // Verify the tx targets a vault we manage
    const vaultId = Object.keys(config.managedVaults).find(
      (id) => config.managedVaults[id].loanBrokerId === preparedTx.LoanBrokerID
    )
    if (!vaultId) throw new Error("LoanBrokerID not managed by this watcher")

    // Verify Account matches our wallet
    if (preparedTx.Account !== wallet.address) {
      throw new Error("Transaction Account does not match watcher wallet")
    }

    // Re-autofill to ensure fresh Sequence and LastLedgerSequence
    const acctInfo = await client.request({ command: "account_info", account: wallet.address })
    const ledgerInfo = await client.request({ command: "ledger_current" })
    preparedTx.Sequence = acctInfo.result.account_data.Sequence
    preparedTx.LastLedgerSequence = ledgerInfo.result.ledger_current_index + 20

    // Both parties sign the same data
    const signingData = encodeForSigning(preparedTx)

    // Broker signs
    preparedTx.TxnSignature = sign(signingData, wallet.privateKey)

    // Attach borrower's CounterpartySignature
    preparedTx.CounterpartySignature = {
      SigningPubKey: borrowerPubKey,
      TxnSignature: borrowerSignature,
    }

    // Encode and submit
    const tx_blob = encode(preparedTx)
    const result = await client.request({ command: "submit", tx_blob })
    if (result.result.engine_result !== "tesSUCCESS") {
      throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
    }

    // Wait for validation
    const txHash = result.result.tx_json?.hash
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const txResult = await client.request({ command: "tx", transaction: txHash })
        if (txResult.result.validated) {
          const loanId = txResult.result.meta?.AffectedNodes?.find(
            (n) => n.CreatedNode?.LedgerEntryType === "Loan"
          )?.CreatedNode?.LedgerIndex
          return { hash: txHash, loanId, result: "tesSUCCESS" }
        }
      } catch {}
    }
    return { hash: txHash, loanId: null, result: "pending" }
  }

  /**
   * Sign and submit a single-signer XLS-66 tx on behalf of the watcher.
   * Used for LoanPay, LoanManage, LoanDelete when the watcher is the Account.
   */
  async signAndSubmitRaw(tx) {
    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!client || !wallet) throw new Error("Watcher not connected")

    const sign = await loadRawSign()

    const acctInfo = await client.request({ command: "account_info", account: wallet.address })
    const ledgerInfo = await client.request({ command: "ledger_current" })

    const prepared = {
      ...tx,
      Account: wallet.address,
      Fee: "12",
      Sequence: acctInfo.result.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
      NetworkID: 2002,
      SigningPubKey: wallet.publicKey,
    }

    prepared.TxnSignature = sign(encodeForSigning(prepared), wallet.privateKey)
    const tx_blob = encode(prepared)
    const result = await client.request({ command: "submit", tx_blob })
    if (result.result.engine_result !== "tesSUCCESS") {
      throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
    }

    const txHash = result.result.tx_json?.hash
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const txResult = await client.request({ command: "tx", transaction: txHash })
        if (txResult.result.validated) return txResult.result
      } catch {}
    }
    const txResult = await client.request({ command: "tx", transaction: txHash })
    return txResult.result
  }

  /**
   * List vaults available for borrowing.
   * Queries each managed vault for its current state.
   */
  async getAvailableVaults() {
    const client = this.connections.getClient()
    if (!client) throw new Error("Watcher not connected")

    const vaults = []
    for (const [vaultId, vaultConfig] of Object.entries(config.managedVaults)) {
      if (!vaultConfig.loanBrokerId) continue
      try {
        const vaultInfo = await client.request({ command: "ledger_entry", index: vaultId })
        const vaultData = vaultInfo.result.node
        vaults.push({
          vaultId,
          name: vaultConfig.name,
          loanBrokerId: vaultConfig.loanBrokerId,
          asset: vaultData.Asset || "XRP",
          availableLiquidity: vaultData.Asset || "0",
          totalShares: vaultData.TotalShares || "0",
          brokerAccount: this.connections.getWallet()?.address || null,
        })
      } catch (err) {
        console.warn(`[cosign] Failed to fetch vault ${vaultId}:`, err.message)
      }
    }
    return vaults
  }

  /**
   * Get active loans for a borrower account.
   */
  async getLoansForAccount(account) {
    const client = this.connections.getClient()
    if (!client) throw new Error("Watcher not connected")

    const response = await client.request({
      command: "account_objects",
      account,
      type: "loan",
    })
    return response.result.account_objects || []
  }
}
```

- [ ] **Step 3: Register cosign routes in watcher bot**

Edit `apps/watcher/src/index.js`. Add these lines after the existing route definitions (after line 58, before `// --- Startup ---`):

```js
import { CosignHandler } from "./cosign-handler.js"
```

Add this import at the top with the other imports (line 5).

Then add these routes after the existing `/api/health` route (after line 59):

```js
// --- Loan Cosigning Routes ---

let cosignHandler = null

app.get("/api/loans/available", async (req, res) => {
  try {
    if (!cosignHandler) return res.status(503).json({ error: "Cosign service not ready" })
    const vaults = await cosignHandler.getAvailableVaults()
    res.json({ vaults })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/loans/prepare", async (req, res) => {
  try {
    if (!cosignHandler) return res.status(503).json({ error: "Cosign service not ready" })
    const { vaultId, borrowerAddress, principalDrops, interestRate, paymentTotal, paymentInterval, gracePeriod } = req.body
    if (!vaultId || !borrowerAddress || !principalDrops) {
      return res.status(400).json({ error: "Missing required fields: vaultId, borrowerAddress, principalDrops" })
    }
    const preparedTx = await cosignHandler.prepareLoanTx({
      vaultId,
      borrowerAddress,
      principalDrops: parseInt(principalDrops, 10),
      interestRate,
      paymentTotal,
      paymentInterval,
      gracePeriod,
    })
    res.json({ preparedTx })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post("/api/loans/cosign", async (req, res) => {
  try {
    if (!cosignHandler) return res.status(503).json({ error: "Cosign service not ready" })
    const { preparedTx, borrowerSignature, borrowerPubKey } = req.body
    if (!preparedTx || !borrowerSignature || !borrowerPubKey) {
      return res.status(400).json({ error: "Missing required fields: preparedTx, borrowerSignature, borrowerPubKey" })
    }
    const result = await cosignHandler.cosignAndSubmit({ preparedTx, borrowerSignature, borrowerPubKey })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

app.get("/api/loans/status", async (req, res) => {
  try {
    if (!cosignHandler) return res.status(503).json({ error: "Cosign service not ready" })
    const { account } = req.query
    if (!account) return res.status(400).json({ error: "Missing query param: account" })
    const loans = await cosignHandler.getLoansForAccount(account)
    res.json({ loans })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

In the `main()` function, after `await connections.connect()` (line 64), initialize the cosign handler:

```js
  cosignHandler = new CosignHandler(connections)
```

- [ ] **Step 4: Verify watcher bot starts**

Run: `cd apps/watcher && node src/index.js 2>&1 | head -10`

Expected: `[watcher] HTTP API on port 3001` and `[watcher] Ready — monitoring DevNet prices`

Stop the process after verifying.

- [ ] **Step 5: Commit**

```bash
git add apps/watcher/src/cosign-handler.js apps/watcher/src/index.js apps/watcher/src/config.js
git commit -m "feat: add cosign handler to watcher bot with prepare/cosign/status endpoints"
```

---

### Task 3: Next.js API Routes (Relay to Watcher Bot)

**Files:**
- Create: `apps/web/app/api/loans/available/route.js`
- Create: `apps/web/app/api/loans/prepare/route.js`
- Create: `apps/web/app/api/loans/cosign/route.js`
- Create: `apps/web/app/api/loans/status/route.js`

These are thin relay routes that forward requests to the watcher bot's HTTP API. The watcher bot holds the keys and signing logic.

- [ ] **Step 1: Create the available vaults route**

Create `apps/web/app/api/loans/available/route.js`:

```js
const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function GET() {
  try {
    const res = await fetch(`${WATCHER_URL}/api/loans/available`)
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
```

- [ ] **Step 2: Create the prepare route**

Create `apps/web/app/api/loans/prepare/route.js`:

```js
const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function POST(request) {
  try {
    const body = await request.json()
    const res = await fetch(`${WATCHER_URL}/api/loans/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
```

- [ ] **Step 3: Create the cosign route**

Create `apps/web/app/api/loans/cosign/route.js`:

```js
const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function POST(request) {
  try {
    const body = await request.json()
    const res = await fetch(`${WATCHER_URL}/api/loans/cosign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
```

- [ ] **Step 4: Create the status route**

Create `apps/web/app/api/loans/status/route.js`:

```js
const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const account = searchParams.get("account")
    if (!account) return Response.json({ error: "Missing account param" }, { status: 400 })
    const res = await fetch(`${WATCHER_URL}/api/loans/status?account=${account}`)
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/loans/
git commit -m "feat: add Next.js API routes for loans (available, prepare, cosign, status)"
```

---

### Task 4: useLoanMarket Hook

**Files:**
- Create: `apps/web/hooks/useLoanMarket.js`

This hook manages all loan marketplace operations from the browser. For LoanSet (cosigned), it uses a two-phase flow via the API: prepare → borrower signs → cosign. For single-signer txs (LoanPay, LoanManage, LoanDelete), the borrower signs and the signed blob is relayed through the watcher bot.

The key challenge is getting the browser wallet to sign XLS-66 types. The `xrpl` package's `encodeForSigning` works in the browser (ripple-binary-codec supports XLS-66). The wallet adapter needs to sign the transaction — we attempt `walletManager.sign()` first, and if xrpl-connect rejects the unknown tx type, we fall back to directly calling the adapter.

- [ ] **Step 1: Create the useLoanMarket hook**

Create `apps/web/hooks/useLoanMarket.js`:

```js
"use client"

import { useCallback, useState, useEffect } from "react"
import { encodeForSigning } from "xrpl"
import { useWallet } from "@/components/providers/WalletProvider"

const POLL_INTERVAL = 30000 // 30s

/**
 * Attempt to sign a transaction using the wallet adapter.
 * First tries walletManager.sign() (works if xrpl-connect accepts the tx type).
 * Falls back to the adapter's direct signing method if validation fails.
 */
async function signWithWallet(walletManager, tx) {
  try {
    // Primary path: xrpl-connect's sign method
    const result = await walletManager.sign(tx)
    return result
  } catch (err) {
    const msg = err.message || ""
    // If the error is NOT about unknown tx type, re-throw
    if (!msg.includes("valid") && !msg.includes("TransactionType") && !msg.includes("Unknown")) {
      throw err
    }
    // Fallback: access the active adapter directly
    // xrpl-connect adapters typically have a signPayload or similar method
    const adapter = walletManager._adapter || walletManager.adapter
    if (adapter && typeof adapter.sign === "function") {
      return await adapter.sign(tx)
    }
    throw new Error(`Wallet adapter does not support signing ${tx.TransactionType}. ${msg}`)
  }
}

export function useLoanMarket() {
  const { walletManager, isConnected } = useWallet()
  const [availableVaults, setAvailableVaults] = useState([])
  const [activeLoans, setActiveLoans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch available vaults from API
  const fetchAvailableVaults = useCallback(async () => {
    try {
      const res = await fetch("/api/loans/available")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch vaults")
      setAvailableVaults(data.vaults || [])
      return data.vaults || []
    } catch (err) {
      console.error("[useLoanMarket] fetchAvailableVaults:", err.message)
      setError(err.message)
      return []
    }
  }, [])

  // Fetch active loans for connected wallet
  const fetchActiveLoans = useCallback(async () => {
    if (!walletManager?.account?.address) return []
    try {
      const res = await fetch(`/api/loans/status?account=${walletManager.account.address}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch loans")
      setActiveLoans(data.loans || [])
      return data.loans || []
    } catch (err) {
      console.error("[useLoanMarket] fetchActiveLoans:", err.message)
      return []
    }
  }, [walletManager])

  // Poll for updates
  useEffect(() => {
    fetchAvailableVaults()
    if (isConnected) fetchActiveLoans()
    const interval = setInterval(() => {
      fetchAvailableVaults()
      if (isConnected) fetchActiveLoans()
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [isConnected, fetchAvailableVaults, fetchActiveLoans])

  /**
   * Borrow from a vault (cosigned LoanSet).
   * Two-phase: prepare tx via API → borrower signs → cosign via API.
   */
  const borrowFromVault = useCallback(async (vaultId, principalDrops, opts = {}) => {
    if (!walletManager?.account) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      // Phase 1: Ask watcher bot to prepare the LoanSet tx
      const prepRes = await fetch("/api/loans/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultId,
          borrowerAddress: walletManager.account.address,
          principalDrops: String(principalDrops),
          interestRate: opts.interestRate,
          paymentTotal: opts.paymentTotal,
          paymentInterval: opts.paymentInterval,
          gracePeriod: opts.gracePeriod,
        }),
      })
      const prepData = await prepRes.json()
      if (!prepRes.ok) throw new Error(prepData.error || "Failed to prepare loan")
      const { preparedTx } = prepData

      // Phase 2: Borrower signs the prepared tx
      // The borrower needs to sign the same data the broker will sign
      const signingData = encodeForSigning(preparedTx)

      // Get the wallet to sign the tx
      const signResult = await signWithWallet(walletManager, preparedTx)

      // Extract the borrower's signature from the signed result
      // xrpl-connect returns { tx_blob, tx_json, ... }
      let borrowerSignature, borrowerPubKey
      if (signResult.tx_json?.TxnSignature) {
        borrowerSignature = signResult.tx_json.TxnSignature
        borrowerPubKey = signResult.tx_json.SigningPubKey
      } else if (signResult.TxnSignature) {
        borrowerSignature = signResult.TxnSignature
        borrowerPubKey = signResult.SigningPubKey
      } else {
        // If we can't extract from the result, the signature is embedded in the blob
        // This shouldn't happen with proper wallet integration
        throw new Error("Could not extract signature from wallet response")
      }

      // Phase 3: Send to watcher bot for cosigning and submission
      const cosignRes = await fetch("/api/loans/cosign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparedTx,
          borrowerSignature,
          borrowerPubKey,
        }),
      })
      const cosignData = await cosignRes.json()
      if (!cosignRes.ok || !cosignData.success) {
        throw new Error(cosignData.error || "Cosign failed")
      }

      // Refresh loans list
      await fetchActiveLoans()
      return cosignData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  /**
   * Repay a loan (single-signer LoanPay).
   * The borrower signs and submits directly via the watcher bot.
   */
  const repayLoan = useCallback(async (loanId, amountDrops, flags = 0) => {
    if (!walletManager?.account) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanPay",
        Account: walletManager.account.address,
        LoanID: loanId,
        Amount: String(amountDrops),
        Flags: flags,
      }
      const signResult = await signWithWallet(walletManager, tx)
      // For single-signer txs signed by the wallet, we can submit the blob directly
      if (signResult.tx_blob) {
        const res = await fetch("/api/loans/cosign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_blob: signResult.tx_blob,
            singleSigner: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Submit failed")
        await fetchActiveLoans()
        return data
      }
      throw new Error("Wallet did not return signed tx_blob")
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  /**
   * Manage a loan (single-signer LoanManage).
   */
  const manageLoan = useCallback(async (loanId, flags) => {
    if (!walletManager?.account) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanManage",
        Account: walletManager.account.address,
        LoanID: loanId,
        Flags: flags,
      }
      const signResult = await signWithWallet(walletManager, tx)
      if (signResult.tx_blob) {
        const res = await fetch("/api/loans/cosign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_blob: signResult.tx_blob,
            singleSigner: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Submit failed")
        await fetchActiveLoans()
        return data
      }
      throw new Error("Wallet did not return signed tx_blob")
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  /**
   * Close a loan (LoanDelete after full repayment).
   */
  const closeLoan = useCallback(async (loanId) => {
    if (!walletManager?.account) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanDelete",
        Account: walletManager.account.address,
        LoanID: loanId,
      }
      const signResult = await signWithWallet(walletManager, tx)
      if (signResult.tx_blob) {
        const res = await fetch("/api/loans/cosign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_blob: signResult.tx_blob,
            singleSigner: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Submit failed")
        await fetchActiveLoans()
        return data
      }
      throw new Error("Wallet did not return signed tx_blob")
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  return {
    availableVaults,
    activeLoans,
    loading,
    error,
    fetchAvailableVaults,
    fetchActiveLoans,
    borrowFromVault,
    repayLoan,
    manageLoan,
    closeLoan,
  }
}
```

- [ ] **Step 2: Update watcher bot cosign route to handle single-signer tx_blob submissions**

In `apps/watcher/src/index.js`, update the `/api/loans/cosign` route to also accept `{ tx_blob, singleSigner: true }`:

Replace the cosign route body with:

```js
app.post("/api/loans/cosign", async (req, res) => {
  try {
    if (!cosignHandler) return res.status(503).json({ error: "Cosign service not ready" })
    const { preparedTx, borrowerSignature, borrowerPubKey, tx_blob, singleSigner } = req.body

    // Single-signer path: just submit the pre-signed blob
    if (singleSigner && tx_blob) {
      const client = connections.getClient()
      const result = await client.request({ command: "submit", tx_blob })
      if (result.result.engine_result !== "tesSUCCESS") {
        throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
      }
      return res.json({ success: true, hash: result.result.tx_json?.hash, result: result.result.engine_result })
    }

    // Cosign path: broker + borrower signatures
    if (!preparedTx || !borrowerSignature || !borrowerPubKey) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    const result = await cosignHandler.cosignAndSubmit({ preparedTx, borrowerSignature, borrowerPubKey })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/hooks/useLoanMarket.js apps/watcher/src/index.js
git commit -m "feat: add useLoanMarket hook with two-phase cosign and single-signer flows"
```

---

### Task 5: shadcn/ui Dialog Component

**Files:**
- Create: `apps/web/components/ui/dialog.js`

The UI needs modal dialogs (borrow, repay, manage). The project uses shadcn/ui but no Dialog component exists yet. Install it.

- [ ] **Step 1: Add the Dialog component**

Run: `cd apps/web && npx shadcn@latest add dialog 2>&1 | tail -5`

If shadcn CLI doesn't work (custom setup), create `apps/web/components/ui/dialog.js` manually:

```js
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/20 bg-black p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-none opacity-70 ring-offset-black transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-white/10 data-[state=open]:text-white/70">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-mono uppercase tracking-widest text-white", className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-white/60 font-mono", className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose }
```

- [ ] **Step 2: Install @radix-ui/react-dialog if needed**

Run: `cd apps/web && pnpm add @radix-ui/react-dialog`

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/ui/dialog.js
git commit -m "feat: add shadcn/ui Dialog component for loan modals"
```

---

### Task 6: Loan Marketplace UI Components

**Files:**
- Create: `apps/web/components/loans/LoanMarketplace.js`
- Create: `apps/web/components/loans/LoanBorrowModal.js`
- Create: `apps/web/components/loans/ActiveLoans.js`
- Create: `apps/web/components/loans/LoanRepayModal.js`
- Create: `apps/web/components/loans/LoanManageModal.js`

All components follow the codebase's existing patterns: `"use client"`, shadcn/ui components, Tailwind dark theme with `font-mono`, `rounded-none`, `border-white/20`, and HUD-style cards.

- [ ] **Step 1: Create LoanBorrowModal**

Create `apps/web/components/loans/LoanBorrowModal.js`:

```js
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { LENDING } from "@/lib/constants"

export function LoanBorrowModal({ vault, open, onOpenChange, onBorrow }) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const amountDrops = Math.floor(parseFloat(amount || "0") * 1_000_000)

  const handleBorrow = async (e) => {
    e.preventDefault()
    if (!amountDrops || amountDrops <= 0) return
    setIsSubmitting(true)
    setResult(null)
    try {
      const res = await onBorrow(vault.vaultId, amountDrops)
      setResult({ success: true, hash: res.hash, loanId: res.loanId })
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-white/20 bg-black/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">BORROW FROM VAULT</DialogTitle>
          <DialogDescription>{vault?.name || "Vault"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBorrow} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70 font-mono text-xs uppercase">Amount (XRP)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="border border-white/10 p-3 space-y-1 text-xs font-mono text-white/60">
            <div className="flex justify-between">
              <span>Interest Rate</span>
              <span className="text-white">{(LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Payments</span>
              <span className="text-white">12 monthly</span>
            </div>
            <div className="flex justify-between">
              <span>Grace Period</span>
              <span className="text-white">{LENDING.DEFAULT_GRACE_PERIOD / 86400} days</span>
            </div>
            {amountDrops > 0 && (
              <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Principal</span>
                <span className="text-white">{(amountDrops / 1_000_000).toFixed(6)} XRP</span>
              </div>
            )}
          </div>

          {!result && (
            <Button
              type="submit"
              disabled={isSubmitting || !amountDrops}
              className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SIGNING...</>
              ) : (
                "CONFIRM BORROW"
              )}
            </Button>
          )}

          {result && (
            <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription className="ml-2 text-xs">
                {result.success ? (
                  <div>
                    <p>Loan created successfully</p>
                    <p className="break-all mt-1 text-white/60">Hash: {result.hash}</p>
                    {result.loanId && <p className="break-all text-white/60">Loan ID: {result.loanId}</p>}
                  </div>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create LoanRepayModal**

Create `apps/web/components/loans/LoanRepayModal.js`:

```js
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LOAN_PAY_FLAGS } from "@/lib/constants"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function LoanRepayModal({ loan, open, onOpenChange, onRepay }) {
  const [amount, setAmount] = useState("")
  const [fullPayment, setFullPayment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const amountDrops = Math.floor(parseFloat(amount || "0") * 1_000_000)

  const handleRepay = async (e) => {
    e.preventDefault()
    if (!amountDrops || amountDrops <= 0) return
    setIsSubmitting(true)
    setResult(null)
    try {
      const flags = fullPayment ? LOAN_PAY_FLAGS.tfLoanFullPayment : 0
      const res = await onRepay(loan.index || loan.LoanID, amountDrops, flags)
      setResult({ success: true, hash: res.hash })
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setResult(null)
    setFullPayment(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-white/20 bg-black/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">REPAY LOAN</DialogTitle>
          <DialogDescription className="break-all text-xs">
            {loan?.index || loan?.LoanID || "Loan"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRepay} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70 font-mono text-xs uppercase">Amount (XRP)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20"
              required
              disabled={isSubmitting}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-mono text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={fullPayment}
              onChange={(e) => setFullPayment(e.target.checked)}
              className="rounded-none"
            />
            Full payment (close loan)
          </label>

          {!result && (
            <Button
              type="submit"
              disabled={isSubmitting || !amountDrops}
              className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SIGNING...</>
              ) : (
                "CONFIRM REPAYMENT"
              )}
            </Button>
          )}

          {result && (
            <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription className="ml-2 text-xs">
                {result.success ? (
                  <p className="break-all">Repayment submitted. Hash: {result.hash}</p>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Create LoanManageModal**

Create `apps/web/components/loans/LoanManageModal.js`:

```js
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LOAN_MANAGE_FLAGS } from "@/lib/constants"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

const ACTIONS = [
  { key: "default", label: "DEFAULT", flag: LOAN_MANAGE_FLAGS.tfLoanDefault, desc: "Mark loan as defaulted" },
  { key: "impair", label: "IMPAIR", flag: LOAN_MANAGE_FLAGS.tfLoanImpair, desc: "Mark loan as impaired" },
  { key: "unimpair", label: "UNIMPAIR", flag: LOAN_MANAGE_FLAGS.tfLoanUnimpair, desc: "Remove impairment flag" },
]

export function LoanManageModal({ loan, open, onOpenChange, onManage }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleAction = async (flags) => {
    setIsSubmitting(true)
    setResult(null)
    try {
      const res = await onManage(loan.index || loan.LoanID, flags)
      setResult({ success: true, hash: res.hash })
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-white/20 bg-black/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">MANAGE LOAN</DialogTitle>
          <DialogDescription className="break-all text-xs">
            {loan?.index || loan?.LoanID || "Loan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {ACTIONS.map((action) => (
            <Button
              key={action.key}
              onClick={() => handleAction(action.flag)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs justify-start"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              <span className="font-bold mr-2">{action.label}</span>
              <span className="text-white/50">{action.desc}</span>
            </Button>
          ))}
        </div>

        {result && (
          <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription className="ml-2 text-xs">
              {result.success ? (
                <p className="break-all">Action submitted. Hash: {result.hash}</p>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Create LoanMarketplace**

Create `apps/web/components/loans/LoanMarketplace.js`:

```js
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoanBorrowModal } from "./LoanBorrowModal"
import { Loader2, Vault, Info } from "lucide-react"
import { useWallet } from "@/components/providers/WalletProvider"
import { LENDING } from "@/lib/constants"

export function LoanMarketplace({ vaults, loading, onBorrow }) {
  const { isConnected } = useWallet()
  const [selectedVault, setSelectedVault] = useState(null)
  const [borrowOpen, setBorrowOpen] = useState(false)

  const handleBorrowClick = (vault) => {
    setSelectedVault(vault)
    setBorrowOpen(true)
  }

  return (
    <>
      <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
        <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-white">
              Available Vaults
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vaults.length === 0 && !loading && (
            <div className="p-6 text-center text-white/40 font-mono text-xs">
              No vaults available for lending
            </div>
          )}
          {vaults.map((vault) => {
            const liquidity = parseInt(vault.availableLiquidity || "0", 10)
            const xrpLiquidity = (liquidity / 1_000_000).toFixed(2)
            return (
              <div
                key={vault.vaultId}
                className="border-b border-white/10 last:border-b-0 p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Vault className="h-3 w-3 text-white/40 flex-shrink-0" />
                    <span className="font-mono text-xs text-white font-bold truncate">{vault.name}</span>
                    <Badge variant="outline" className="rounded-none border-white/20 text-white/60 text-[10px] font-mono">
                      XRP
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono text-white/40 mt-1">
                    <span>Rate: {(LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1)}%</span>
                    <span>Liquidity: {xrpLiquidity} XRP</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/20 mt-1 truncate">
                    {vault.vaultId}
                  </div>
                </div>
                <Button
                  onClick={() => handleBorrowClick(vault)}
                  disabled={!isConnected || liquidity <= 0}
                  className="rounded-none bg-white text-black hover:bg-slate-200 font-mono text-xs font-bold tracking-widest ml-4 flex-shrink-0"
                >
                  BORROW
                </Button>
              </div>
            )
          })}

          {!isConnected && (
            <Alert className="rounded-none border-amber-500/50 bg-amber-500/10 text-amber-200 font-mono m-4">
              <Info className="h-4 w-4 text-amber-200" />
              <AlertDescription className="ml-2 text-xs">
                Connect your wallet to borrow.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedVault && (
        <LoanBorrowModal
          vault={selectedVault}
          open={borrowOpen}
          onOpenChange={setBorrowOpen}
          onBorrow={onBorrow}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: Create ActiveLoans**

Create `apps/web/components/loans/ActiveLoans.js`:

```js
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoanRepayModal } from "./LoanRepayModal"
import { LoanManageModal } from "./LoanManageModal"
import { Loader2, CreditCard, Settings } from "lucide-react"

export function ActiveLoans({ loans, loading, onRepay, onManage, onClose }) {
  const [repayLoan, setRepayLoan] = useState(null)
  const [manageLoan, setManageLoan] = useState(null)

  return (
    <>
      <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
        <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-white">
              My Active Loans
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loans.length === 0 && !loading && (
            <div className="p-6 text-center text-white/40 font-mono text-xs">
              No active loans
            </div>
          )}
          {loans.map((loan, i) => {
            const principal = parseInt(loan.PrincipalRequested || loan.Principal || "0", 10)
            const outstanding = parseInt(loan.OutstandingBalance || loan.Balance || "0", 10)
            const loanId = loan.index || loan.LoanID || `loan-${i}`
            return (
              <div
                key={loanId}
                className="border-b border-white/10 last:border-b-0 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-white/40" />
                    <span className="font-mono text-xs text-white font-bold">
                      {(principal / 1_000_000).toFixed(2)} XRP
                    </span>
                    <Badge variant="outline" className="rounded-none border-green-500/30 text-green-400 text-[10px] font-mono">
                      ACTIVE
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setRepayLoan(loan)}
                      variant="outline"
                      size="sm"
                      className="rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-[10px] h-7"
                    >
                      REPAY
                    </Button>
                    <Button
                      onClick={() => setManageLoan(loan)}
                      variant="outline"
                      size="sm"
                      className="rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-[10px] h-7"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 text-[10px] font-mono text-white/40">
                  <span>Outstanding: {(outstanding / 1_000_000).toFixed(6)} XRP</span>
                  <span>Rate: {(parseInt(loan.InterestRate || "500", 10) / 100).toFixed(1)}%</span>
                </div>
                <div className="text-[10px] font-mono text-white/20 mt-1 truncate">
                  {loanId}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {repayLoan && (
        <LoanRepayModal
          loan={repayLoan}
          open={!!repayLoan}
          onOpenChange={(open) => !open && setRepayLoan(null)}
          onRepay={onRepay}
        />
      )}
      {manageLoan && (
        <LoanManageModal
          loan={manageLoan}
          open={!!manageLoan}
          onOpenChange={(open) => !open && setManageLoan(null)}
          onManage={onManage}
        />
      )}
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/loans/
git commit -m "feat: add loan marketplace UI components (marketplace, borrow, repay, manage)"
```

---

### Task 7: Loans Page & Navigation

**Files:**
- Create: `apps/web/app/loans/page.js`
- Modify: `apps/web/app/page.js` (add "loans" tab)

The loans page is wired as a new tab in the main app (alongside dashboard, lending, trading). This matches the existing tab-based navigation in `page.js`.

- [ ] **Step 1: Create the loans page component**

Create `apps/web/app/loans/page.js`:

This file is a standalone component, but we'll actually integrate it into the main page as a tab. Create it as a reusable component first:

Create `apps/web/components/LoansPage.js`:

```js
"use client"

import { useLoanMarket } from "@/hooks/useLoanMarket"
import { LoanMarketplace } from "@/components/loans/LoanMarketplace"
import { ActiveLoans } from "@/components/loans/ActiveLoans"
import { useWallet } from "@/components/providers/WalletProvider"

export function LoansPage() {
  const { isConnected } = useWallet()
  const {
    availableVaults,
    activeLoans,
    loading,
    error,
    borrowFromVault,
    repayLoan,
    manageLoan,
    closeLoan,
  } = useLoanMarket()

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <LoanMarketplace
        vaults={availableVaults}
        loading={loading}
        onBorrow={borrowFromVault}
      />
      {isConnected && (
        <ActiveLoans
          loans={activeLoans}
          loading={loading}
          onRepay={repayLoan}
          onManage={manageLoan}
          onClose={closeLoan}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add "loans" tab to the main page**

Edit `apps/web/app/page.js`.

Add the import at the top with the other component imports:

```js
import { LoansPage } from "../components/LoansPage";
```

Update the tab list array (line 30) from:

```js
{["dashboard", "lending", "trading"].map((tab, i) => {
```

to:

```js
{["dashboard", "lending", "loans", "trading"].map((tab, i) => {
```

Add a new `TabsContent` block after the lending tab's `TabsContent` (after the closing `</TabsContent>` for lending, around line 165):

```js
              {/* LOANS TAB */}
              <TabsContent value="loans" className="animate-in fade-in duration-500">
                <LoansPage />
              </TabsContent>
```

- [ ] **Step 3: Verify the app compiles**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

Check for compilation errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/LoansPage.js apps/web/app/page.js
git commit -m "feat: add Loans tab to main page with marketplace and active loans"
```

---

### Task 8: Wire Up Vault Config & End-to-End Verification

**Files:**
- Modify: `apps/watcher/src/config.js` (populate real vault/broker IDs)

- [ ] **Step 1: Verify devnet addresses are populated**

Check `apps/web/scripts/devnet-addresses.json` for the actual vault and loan broker IDs created by setup-devnet.mjs. Cross-reference with `apps/web/lib/constants.js` to ensure `config.managedVaults` in the watcher has the correct `loanBrokerId` values.

Run: `cat apps/web/scripts/devnet-addresses.json 2>/dev/null || echo "File not found — run setup-devnet.mjs first"`

Update `apps/watcher/src/config.js` with the actual values found.

- [ ] **Step 2: Start the watcher bot and verify endpoints**

Run: `cd apps/watcher && WATCHER_SEED="<seed from .env>" node src/index.js &`

Test the endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Available vaults
curl http://localhost:3001/api/loans/available

# Prepare (should fail with missing params, proving route works)
curl -X POST http://localhost:3001/api/loans/prepare -H "Content-Type: application/json" -d '{}'
```

Expected: health returns `{ connected: true }`, available returns `{ vaults: [...] }`, prepare returns `{ error: "Missing required fields..." }`

- [ ] **Step 3: Start the Next.js app and verify relay**

Run: `cd apps/web && pnpm dev &`

Test:

```bash
curl http://localhost:3000/api/loans/available
```

Expected: Same response as direct watcher bot call.

- [ ] **Step 4: Browser verification**

Open `http://localhost:3000` in browser:
1. Click "Launch App"
2. Navigate to the "LOANS" tab (4th tab)
3. Verify the marketplace shows available vaults
4. Connect wallet (Xaman or Crossmark)
5. Click "BORROW" on a vault
6. Enter amount and click "CONFIRM BORROW"
7. Wallet should prompt for signing
8. After signing, verify the loan is created on XRPL
9. Loan should appear in "My Active Loans"
10. Click "REPAY" and verify the repay flow works

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: wire up vault config and complete loans marketplace integration"
```

---

### Post-Implementation Notes

**If wallet signing of XLS-66 types fails in the browser** (xrpl-connect rejects):

The `signWithWallet` function in `useLoanMarket.js` has a fallback path that tries the adapter's direct `sign` method. If both paths fail, the options are:

1. **Adapter-specific integration:** Import the Xaman SDK directly (`xumm-sdk`) and create payloads via `sdk.payload.create({ txjson: tx })` — Xaman accepts unknown tx types
2. **Server-mediated signing:** For single-signer txs (LoanPay etc.), route through the watcher bot where the borrower authorizes via a signed challenge

The two-phase cosign flow (prepare → sign → cosign) is designed so that if the wallet signing step needs to change, only the `signWithWallet` function needs to be updated — everything else stays the same.
