import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("shared content layout uses the standard site header without At All Times chrome", () => {
  const headerSource = readFileSync(new URL("../components/site/SiteHeader.js", import.meta.url), "utf8")
  const layoutSource = readFileSync(
    new URL("../components/site/ContentPageLayout.js", import.meta.url),
    "utf8"
  )

  assert.doesNotMatch(layoutSource, /AtAllTimesMenu/)
  assert.doesNotMatch(layoutSource, /reserveAtAllTimesSpace/)
  assert.doesNotMatch(headerSource, /reserveAtAllTimesSpace/)
})
