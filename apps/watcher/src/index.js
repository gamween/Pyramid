import express from "express"
import { ConnectionManager } from "./connections.js"
import { OrderCache } from "./order-cache.js"
import { DevnetLoop } from "./devnet-loop.js"
import { ZkProver } from "./zk-prover.js"
import { CosignHandler } from "./cosign-handler.js"
import { config } from "./config.js"

const app = express()
app.use(express.json())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.sendStatus(200)
  next()
})

const connections = new ConnectionManager()
const orderCache = new OrderCache()

let devnetLoop = null
let cosignHandler = null

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
    connected: connections.getClient()?.isConnected() || false,
    wallet: connections.getWallet()?.address || null,
    activeOrders: orderCache.getActiveOrders().length,
    price: devnetLoop?.getPrice() || null,
  })
})

// --- Loan / Cosign Routes ---

app.get("/api/loans/available", async (req, res) => {
  try {
    const vaults = await cosignHandler.getAvailableVaults()
    const borrowerAddress = cosignHandler.borrowerWallet?.address || null
    res.json({ vaults, borrowerAddress })
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message })
  }
})

app.post("/api/loans/borrow", async (req, res) => {
  try {
    const { vaultId, principalDrops, interestRate, paymentTotal, paymentInterval, gracePeriod } = req.body
    if (!vaultId || !principalDrops) {
      return res.status(400).json({ status: "error", message: "Missing vaultId or principalDrops" })
    }
    const result = await cosignHandler.borrowFromVault({
      vaultId,
      principalDrops: parseInt(principalDrops, 10),
      interestRate,
      paymentTotal,
      paymentInterval,
      gracePeriod,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

app.post("/api/loans/repay", async (req, res) => {
  try {
    const { loanId, amountDrops, flags } = req.body
    if (!loanId || !amountDrops) return res.status(400).json({ success: false, error: "Missing loanId or amountDrops" })
    const result = await cosignHandler.repayLoan({ loanId, amountDrops: parseInt(amountDrops, 10), flags: flags || 0 })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

app.post("/api/loans/manage", async (req, res) => {
  try {
    const { loanId, flags } = req.body
    if (!loanId || flags === undefined) return res.status(400).json({ success: false, error: "Missing loanId or flags" })
    const result = await cosignHandler.manageLoan({ loanId, flags })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

app.post("/api/loans/close", async (req, res) => {
  try {
    const { loanId } = req.body
    if (!loanId) return res.status(400).json({ success: false, error: "Missing loanId" })
    const result = await cosignHandler.closeLoan({ loanId })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

app.post("/api/loans/prepare", async (req, res) => {
  try {
    const preparedTx = await cosignHandler.prepareLoanTx(req.body)
    res.json({ preparedTx })
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})

app.post("/api/loans/cosign", async (req, res) => {
  try {
    if (req.body.singleSigner && req.body.tx_blob) {
      const client = connections.getClient()
      const result = await client.request({
        command: "submit",
        tx_blob: req.body.tx_blob,
      })
      res.json(result.result)
    } else {
      const { preparedTx, borrowerSignature, borrowerPubKey } = req.body
      const result = await cosignHandler.cosignAndSubmit({
        preparedTx,
        borrowerSignature,
        borrowerPubKey,
      })
      res.json(result)
    }
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})

app.get("/api/loans/status", async (req, res) => {
  try {
    if (!req.query.account) {
      return res.status(400).json({ status: "error", message: "account query param required" })
    }
    const loans = await cosignHandler.getLoansForAccount(req.query.account)
    res.json({ loans })
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message })
  }
})

// --- Startup ---

async function main() {
  await connections.connect()

  cosignHandler = new CosignHandler(connections)

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

process.on("SIGINT", async () => {
  console.log("\n[watcher] Shutting down...")
  await connections.disconnect()
  process.exit(0)
})
