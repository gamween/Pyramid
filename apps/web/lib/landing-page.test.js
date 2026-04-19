import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("root page composes the landing scene", () => {
  const pageSource = readSource("../app/page.js")

  assert.match(pageSource, /from "\.\.\/components\/site\/landing\/LandingScene"/)
  assert.match(pageSource, /<LandingScene\s*\/>/)
})

test("landing scene wires the landing sections in the approved order", () => {
  const sceneSource = readSource("../components/site/landing/LandingScene.js")

  assert.match(sceneSource, /from "\.\.\/\.\.\/\.\.\/lib\/site-content"/)
  assert.match(sceneSource, /landingSections/)
  assert.match(sceneSource, /SiteHeader/)
  assert.match(sceneSource, /SiteFooter/)
  assert.match(sceneSource, /LandingHero/)
  assert.match(sceneSource, /StorySection/)
  assert.match(sceneSource, /LendingSection/)
  assert.match(sceneSource, /ClosingSection/)
  assert.doesNotMatch(sceneSource, /overflow-hidden/)
  assert.match(
    sceneSource,
    /<LandingHero section=\{heroSection\} \/>\s*<StorySection[\s\S]*section=\{howItWorksSection\}[\s\S]*<StorySection[\s\S]*section=\{tradingToolsSection\}[\s\S]*<LendingSection section=\{lendingSection\} \/>\s*<ClosingSection section=\{closingSection\} \/>/
  )
})

test("story section uses the highlights prop as its only note source", () => {
  const storySource = readSource("../components/site/landing/StorySection.js")

  assert.match(storySource, /highlights = \[\]/)
  assert.match(storySource, /highlights\.map/)
  assert.doesNotMatch(storySource, /sectionNotes/)
  assert.doesNotMatch(storySource, /grid-cols-2/)
  assert.doesNotMatch(storySource, /border museum-rule bg-\[/)
})

test("lending section keeps the protocol pillars open and unboxed", () => {
  const lendingSource = readSource("../components/site/landing/LendingSection.js")

  assert.match(lendingSource, /pillars = \[/)
  assert.doesNotMatch(lendingSource, /grid-cols-4/)
  assert.doesNotMatch(lendingSource, /border museum-rule/)
  assert.doesNotMatch(lendingSource, /shadow-/)
})

test("landing hero includes term links and the app launch cta", () => {
  const heroSource = readSource("../components/site/landing/LandingHero.js")

  assert.match(heroSource, /TermLinksRow/)
  assert.match(heroSource, /href="\/app"/)
  assert.match(heroSource, /Launch App/)
})
