import test from "node:test"
import assert from "node:assert/strict"

import { POST as createOrder } from "./orders/route.js"
import { DELETE as deleteOrder } from "./orders/[owner]/[sequence]/route.js"
import { POST as createDca } from "./dca/route.js"

const originalFetch = globalThis.fetch

function jsonResponse(data, status = 200) {
  return {
    status,
    async json() {
      return data
    },
  }
}

test("orders and dca write routes return 400 on invalid request JSON", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => {
    throw new Error("fetch should not be called")
  }

  for (const handler of [createOrder, createDca]) {
    const response = await handler(
      new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "Invalid request body" })
  }
})

test("watcher write and delete routes return app-owned JSON on fetch rejection", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => {
    throw new Error("watcher offline")
  }

  const orderResponse = await createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "rOwner" }),
    })
  )
  assert.equal(orderResponse.status, 503)
  assert.deepEqual(await orderResponse.json(), { error: "Watcher service unavailable" })

  const deleteResponse = await deleteOrder(new Request("http://localhost/api/orders/rOwner/12", { method: "DELETE" }), {
    params: { owner: "rOwner", sequence: "12" },
  })
  assert.equal(deleteResponse.status, 503)
  assert.deepEqual(await deleteResponse.json(), { error: "Watcher service unavailable" })

  const dcaResponse = await createDca(
    new Request("http://localhost/api/dca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "scheduleA" }),
    })
  )
  assert.equal(dcaResponse.status, 503)
  assert.deepEqual(await dcaResponse.json(), { error: "Watcher service unavailable" })
})

test("watcher write and delete routes return app-owned JSON on non-JSON watcher responses", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => ({
    status: 502,
    async json() {
      throw new Error("invalid json")
    },
  })

  const orderResponse = await createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "rOwner" }),
    })
  )
  assert.equal(orderResponse.status, 503)
  assert.deepEqual(await orderResponse.json(), { error: "Watcher service unavailable" })

  const deleteResponse = await deleteOrder(new Request("http://localhost/api/orders/rOwner/12", { method: "DELETE" }), {
    params: { owner: "rOwner", sequence: "12" },
  })
  assert.equal(deleteResponse.status, 503)
  assert.deepEqual(await deleteResponse.json(), { error: "Watcher service unavailable" })

  const dcaResponse = await createDca(
    new Request("http://localhost/api/dca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "scheduleA" }),
    })
  )
  assert.equal(dcaResponse.status, 503)
  assert.deepEqual(await dcaResponse.json(), { error: "Watcher service unavailable" })
})

test("watcher write routes still proxy successful JSON responses", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => jsonResponse({ status: "ok" }, 201)

  const orderResponse = await createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "rOwner" }),
    })
  )
  assert.equal(orderResponse.status, 201)
  assert.deepEqual(await orderResponse.json(), { status: "ok" })

  const dcaResponse = await createDca(
    new Request("http://localhost/api/dca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "scheduleA" }),
    })
  )
  assert.equal(dcaResponse.status, 201)
  assert.deepEqual(await dcaResponse.json(), { status: "ok" })
})
