import express from "express"
import { ConnectionManager } from "./connections.js"
import { OrderCache } from "./order-cache.js"
import { DevnetLoop } from "./devnet-loop.js"
import { ZkProver } from "./zk-prover.js"
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

// --- Startup ---

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

process.on("SIGINT", async () => {
  console.log("\n[watcher] Shutting down...")
  await connections.disconnect()
  process.exit(0)
})
