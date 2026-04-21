import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("app entry redirects to the assets route instead of rendering the legacy dashboard", () => {
  const source = readSource("../app/app/page.js")

  assert.match(source, /redirect\("\/app\/assets"\)/)
  assert.doesNotMatch(source, /AppExperience/)
})

test("app route tree includes assets, markets, trade spot, and orders pages", () => {
  assert.equal(existsSync(new URL("../app/app/assets/page.js", import.meta.url)), true)
  assert.equal(existsSync(new URL("../app/app/markets/page.js", import.meta.url)), true)
  assert.equal(existsSync(new URL("../app/app/trade/spot/page.js", import.meta.url)), true)
  assert.equal(existsSync(new URL("../app/app/orders/page.js", import.meta.url)), true)
})

test("app layout composes the wallet provider with the new shell layout", () => {
  const source = readSource("../app/app/layout.js")

  assert.match(source, /WalletProvider/)
  assert.match(source, /AppShellLayout/)
  assert.doesNotMatch(source, /PrismBackground/)
})
