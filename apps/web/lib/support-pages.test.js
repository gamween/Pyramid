import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { resolveLearnPageFromParams } from "./learn-page.js"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("support pages compose ContentPageLayout with getSupportPage", () => {
  for (const route of ["about", "contact", "faq", "privacy-policy", "terms-of-service"]) {
    const source = readSource(`../app/${route}/page.js`)

    assert.match(source, /ContentPageLayout/)
    assert.match(source, /getSupportPage/)
    assert.match(source, new RegExp(`page\\.slug === "${route}"|getSupportPage\\("${route}"\\)`))
  }
})

test("about page renders the dedicated portrait asset", () => {
  const source = readSource("../app/about/page.js")

  assert.match(source, /next\/image/)
  assert.match(source, /\/about\/sofiane-zidane-ben-taleb\.jpg/)
  assert.match(source, /ContentPageLayout/)
})

test("contact page renders the registry contact links", () => {
  const source = readSource("../app/contact/page.js")

  assert.match(source, /supportContactLinks/)
  assert.match(source, /ContentPageLayout/)
  assert.doesNotMatch(source, /Direct repository contact/)
  assert.doesNotMatch(source, /github\.com\/gamween\/Pyramid/)
})

test("license page keeps the repository LICENSE and adds a preface", () => {
  const source = readSource("../app/license/page.js")

  assert.match(source, /readFileSync/)
  assert.match(source, /LICENSE/)
  assert.match(source, /ContentPageLayout/)
  assert.match(source, /human-readable/i)
})

test("privacy and terms stay simple layout entrypoints", () => {
  for (const route of ["privacy-policy", "terms-of-service"]) {
    const source = readSource(`../app/${route}/page.js`)

    assert.match(source, /ContentPageLayout/)
    assert.match(source, /getSupportPage/)
    assert.doesNotMatch(source, /supportContactLinks/)
    assert.doesNotMatch(source, /readFileSync/)
  }
})
