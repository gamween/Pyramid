import test from "node:test"
import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

test("web loan API surface exposes the exact live route handlers", async () => {
  const loanApiDir = fileURLToPath(new URL(".", import.meta.url))
  const routeDirs = (await readdir(loanApiDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const expectedRoutes = {
    available: ["GET"],
    borrow: ["POST"],
    manage: ["POST"],
    repay: ["POST"],
    status: ["GET"],
  }

  assert.deepEqual(routeDirs, Object.keys(expectedRoutes))

  for (const routeDir of routeDirs) {
    const imported = await import(`./${routeDir}/route.js`)
    const exportedHandlers = Object.keys(imported).sort()

    assert.deepEqual(
      exportedHandlers,
      expectedRoutes[routeDir],
      `${routeDir} should export only ${expectedRoutes[routeDir].join(", ")}`
    )
  }
})

test("watcher loan API surface declares the exact live loan routes", async () => {
  const watcherIndexPath = fileURLToPath(new URL("../../../../watcher/src/index.js", import.meta.url))
  const watcherSource = await readFile(watcherIndexPath, "utf8")

  const routeMatches = [...watcherSource.matchAll(/app\.(get|post)\("([^"]+)"\s*,/g)]
    .map(([, method, path]) => ({
      method: method.toUpperCase(),
      path,
    }))
    .filter((route) => route.path.startsWith("/api/loans/"))

  assert.match(watcherSource, /\/\/ --- Loan Routes ---/)
  assert.deepEqual(routeMatches, [
    { method: "GET", path: "/api/loans/available" },
    { method: "POST", path: "/api/loans/borrow" },
    { method: "POST", path: "/api/loans/repay" },
    { method: "POST", path: "/api/loans/manage" },
    { method: "GET", path: "/api/loans/status" },
  ])
})
