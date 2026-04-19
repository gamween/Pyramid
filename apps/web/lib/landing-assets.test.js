import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const whiteFillPattern = /fill="#(?:ffffff|fffffe|feffff|fffeff|fefefe|fcfcfc|fdfdfd)"/i

function readAsset(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("landing svg assets are transparent instead of embedding white backgrounds", () => {
  const victory = readAsset("../public/landing/victoire-de-samothrace-dithered.svg")
  const pyramid = readAsset("../public/landing/pyramide-du-louvre-dithered.svg")
  const scribe = readAsset("../public/landing/le-scribe-accroupi-dithered.svg")

  assert.doesNotMatch(victory, whiteFillPattern)
  assert.doesNotMatch(pyramid, whiteFillPattern)
  assert.doesNotMatch(scribe, whiteFillPattern)
})
