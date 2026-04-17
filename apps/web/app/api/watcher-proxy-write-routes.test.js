import test from "node:test"
import assert from "node:assert/strict"

import { GET as listOrders } from "./orders/route.js"
import { POST as createOrder } from "./orders/route.js"
import { DELETE as deleteOrder } from "./orders/[owner]/[sequence]/route.js"
import { POST as createDca } from "./dca/route.js"

const originalFetch = globalThis.fetch

function jsonResponse(data, status = 200) {
  return {
    status,
    async text() {
      return JSON.stringify(data)
    },
    async json() {
      return data
    },
  }
}

function textResponse(text, status = 200) {
  return {
    status,
    async text() {
      return text
    },
    async json() {
      throw new Error("invalid json")
    },
  }
}

function failingTextResponse(status = 200) {
  return {
    status,
    async text() {
      throw new Error("stream broken")
    },
    async json() {
      throw new Error("invalid json")
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

test("orders list route returns unavailable on watcher fetch rejection", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => {
    throw new Error("watcher offline")
  }

  const response = await listOrders(new Request("http://localhost/api/orders", { method: "GET" }))

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: "Watcher service unavailable" })
})

test("orders list route preserves upstream status and wrapper on non-JSON responses", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => textResponse("upstream exploded", 502)

  const response = await listOrders(new Request("http://localhost/api/orders", { method: "GET" }))

  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), {
    error: "Watcher response was not valid JSON",
    upstreamText: "upstream exploded",
  })
})

test("orders list route returns unavailable when upstream text parsing rejects", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => failingTextResponse(502)

  const response = await listOrders(new Request("http://localhost/api/orders", { method: "GET" }))

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: "Watcher service unavailable" })
})

test("watcher write and delete routes preserve upstream status and text on non-JSON responses", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => textResponse("upstream exploded", 502)

  const orderResponse = await createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "rOwner" }),
    })
  )
  assert.equal(orderResponse.status, 502)
  assert.deepEqual(await orderResponse.json(), {
    error: "Watcher response was not valid JSON",
    upstreamText: "upstream exploded",
  })

  const deleteResponse = await deleteOrder(new Request("http://localhost/api/orders/rOwner/12", { method: "DELETE" }), {
    params: { owner: "rOwner", sequence: "12" },
  })
  assert.equal(deleteResponse.status, 502)
  assert.deepEqual(await deleteResponse.json(), {
    error: "Watcher response was not valid JSON",
    upstreamText: "upstream exploded",
  })

  const dcaResponse = await createDca(
    new Request("http://localhost/api/dca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "scheduleA" }),
    })
  )
  assert.equal(dcaResponse.status, 502)
  assert.deepEqual(await dcaResponse.json(), {
    error: "Watcher response was not valid JSON",
    upstreamText: "upstream exploded",
  })
})

test("delete route resolves async params before proxying to the watcher", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  let requestedUrl
  globalThis.fetch = async (url) => {
    requestedUrl = url
    return jsonResponse({ status: "ok" })
  }

  const deleteResponse = await deleteOrder(
    new Request("http://localhost/api/orders/rOwner/12", { method: "DELETE" }),
    {
      params: Promise.resolve({ owner: "rOwner", sequence: "12" }),
    }
  )

  assert.equal(deleteResponse.status, 200)
  assert.deepEqual(await deleteResponse.json(), { status: "ok" })
  assert.equal(requestedUrl, "http://localhost:3001/api/orders/rOwner/12")
})

test("watcher write and delete routes preserve upstream status on empty watcher responses", async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => textResponse("", 404)

  const orderResponse = await createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "rOwner" }),
    })
  )
  assert.equal(orderResponse.status, 404)
  assert.deepEqual(await orderResponse.json(), { error: "Watcher response was not valid JSON" })

  const deleteResponse = await deleteOrder(new Request("http://localhost/api/orders/rOwner/12", { method: "DELETE" }), {
    params: { owner: "rOwner", sequence: "12" },
  })
  assert.equal(deleteResponse.status, 404)
  assert.deepEqual(await deleteResponse.json(), { error: "Watcher response was not valid JSON" })

  const dcaResponse = await createDca(
    new Request("http://localhost/api/dca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "scheduleA" }),
    })
  )
  assert.equal(dcaResponse.status, 404)
  assert.deepEqual(await dcaResponse.json(), { error: "Watcher response was not valid JSON" })
})

test("watcher write and delete routes return unavailable on fetch rejection", async (t) => {
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
