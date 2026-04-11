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
