import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("AtAllTimesMenu uses non-modal navigation semantics", () => {
  const source = readFileSync(new URL("../components/site/AtAllTimesMenu.js", import.meta.url), "utf8")

  assert.doesNotMatch(source, /aria-haspopup="dialog"/)
  assert.doesNotMatch(source, /role="dialog"/)
  assert.match(source, /<nav[\s\S]*aria-label="At All Times"/)
})

test("ContentPageLayout reserves header space for the At All Times control", () => {
  const headerSource = readFileSync(new URL("../components/site/SiteHeader.js", import.meta.url), "utf8")
  const layoutSource = readFileSync(
    new URL("../components/site/ContentPageLayout.js", import.meta.url),
    "utf8"
  )

  assert.match(layoutSource, /<SiteHeader reserveAtAllTimesSpace \/>/)
  assert.match(headerSource, /reserveAtAllTimesSpace = false/)
  assert.match(headerSource, /reserveAtAllTimesSpace\s*\?/)
})
