import test from "node:test"
import assert from "node:assert/strict"

import { bucketTimestamp } from "./timeframes.js"

test("bucketTimestamp rounds down to the start of the selected interval", () => {
  assert.equal(bucketTimestamp(1713703325000, "1m"), 1713703320000)
  assert.equal(bucketTimestamp(1713703325000, "5m"), 1713703200000)
  assert.equal(bucketTimestamp(1713703325000, "1h"), 1713700800000)
})
