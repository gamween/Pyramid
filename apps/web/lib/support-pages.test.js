import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("support pages compose ContentPageLayout with getSupportPage", () => {
  for (const route of ["about", "contact", "faq"]) {
    const source = readSource(`../app/${route}/page.js`)

    assert.match(source, /ContentPageLayout/)
    assert.match(source, /getSupportPage/)
    assert.match(source, new RegExp(`page\\.slug === "${route}"|getSupportPage\\("${route}"\\)`))
  }
})

test("license page reads the repository LICENSE file", () => {
  const source = readSource("../app/license/page.js")

  assert.match(source, /readFileSync/)
  assert.match(source, /LICENSE/)
  assert.match(source, /ContentPageLayout/)
})

test("learn pages use the registry, static params, and notFound", () => {
  const source = readSource("../app/learn/[slug]/page.js")

  assert.match(source, /generateStaticParams/)
  assert.match(source, /getLearnPage/)
  assert.match(source, /notFound/)
  assert.match(source, /officialLinks/)
  assert.match(source, /What it is/)
  assert.match(source, /Why it matters in Pyramid/)
})
