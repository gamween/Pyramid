import test from "node:test"
import assert from "node:assert/strict"

test("loan route modules are importable under Node ESM", async () => {
  const modules = [
    "./available/route.js",
    "./borrow/route.js",
    "./close/route.js",
    "./cosign/route.js",
    "./manage/route.js",
    "./prepare/route.js",
    "./repay/route.js",
    "./status/route.js",
  ]

  for (const specifier of modules) {
    const imported = await import(specifier)
    assert.equal(typeof imported, "object")
  }
})
