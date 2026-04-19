import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("AtAllTimesMenu uses non-modal navigation semantics", () => {
  const source = readFileSync(new URL("../components/site/AtAllTimesMenu.js", import.meta.url), "utf8")

  assert.doesNotMatch(source, /aria-haspopup="dialog"/)
  assert.doesNotMatch(source, /role="dialog"/)
  assert.match(source, /<nav[\s\S]*aria-label="At All Times"/)
})
