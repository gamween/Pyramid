import test from "node:test"
import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

test("loan route modules are importable under Node ESM", async () => {
  const loanApiDir = fileURLToPath(new URL(".", import.meta.url))
  const routeDirs = (await readdir(loanApiDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.deepEqual(routeDirs, [
    "available",
    "borrow",
    "manage",
    "repay",
    "status",
  ])

  const modules = routeDirs.map((routeDir) => `./${routeDir}/route.js`)

  for (const specifier of modules) {
    const imported = await import(specifier)
    assert.equal(typeof imported, "object")
  }
})

test("active loan source only references the live loan surface", async () => {
  const files = [
    fileURLToPath(new URL("../../../hooks/useLoanMarket.js", import.meta.url)),
    fileURLToPath(new URL("../../../components/LoansPage.js", import.meta.url)),
    fileURLToPath(new URL("../../../components/loans/ActiveLoans.js", import.meta.url)),
    fileURLToPath(new URL("../../../../watcher/src/index.js", import.meta.url)),
    fileURLToPath(new URL("../../../../watcher/src/cosign-handler.js", import.meta.url)),
  ]

  const forbiddenPatterns = [
    "closeLoan",
    "onClose",
    "/api/loans/close",
    "/api/loans/prepare",
    "/api/loans/cosign",
    "prepareLoanTx",
    "cosignAndSubmit",
    "useTickets",
  ]

  for (const file of files) {
    const source = await readFile(file, "utf8")
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        source.includes(pattern),
        false,
        `${file} should not contain ${pattern}`
      )
    }
  }
})
