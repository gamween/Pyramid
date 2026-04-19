import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const whiteFillPattern = /fill="#(?:ffffff|fffffe|feffff|fffeff|fefefe|fcfcfc|fdfdfd)"/i

function readAsset(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("landing svg assets are transparent instead of embedding white backgrounds", () => {
  const victory = readAsset("../public/landing/winged-victory-of-samothrace.svg")
  const pyramid = readAsset("../public/landing/louvre-pyramid.svg")
  const scribe = readAsset("../public/landing/seated-scribe.svg")
  const discobolus = readAsset("../public/landing/discobolus.svg")

  assert.doesNotMatch(victory, whiteFillPattern)
  assert.doesNotMatch(pyramid, whiteFillPattern)
  assert.doesNotMatch(scribe, whiteFillPattern)
  assert.doesNotMatch(discobolus, whiteFillPattern)
})
