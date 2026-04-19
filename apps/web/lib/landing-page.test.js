import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("root page composes the landing scene", () => {
  const pageSource = readFileSync(new URL("../app/page.js", import.meta.url), "utf8")

  assert.match(pageSource, /from "\.\.\/components\/site\/landing\/LandingScene"/)
  assert.match(pageSource, /<LandingScene\s*\/>/)
})

test("landing scene wires the museum editorial sections from site content", () => {
  const sceneSource = readFileSync(
    new URL("../components/site/landing/LandingScene.js", import.meta.url),
    "utf8"
  )

  assert.match(sceneSource, /from "\.\.\/\.\.\/\.\.\/lib\/site-content"/)
  assert.match(sceneSource, /landingSections/)
  assert.match(sceneSource, /SiteHeader/)
  assert.match(sceneSource, /SiteFooter/)
  assert.match(sceneSource, /LandingHero/)
  assert.match(sceneSource, /StorySection/)
  assert.match(sceneSource, /LendingSection/)
  assert.match(sceneSource, /ClosingSection/)
})

test("landing hero includes term links and the app launch cta", () => {
  const heroSource = readFileSync(
    new URL("../components/site/landing/LandingHero.js", import.meta.url),
    "utf8"
  )

  assert.match(heroSource, /TermLinksRow/)
  assert.match(heroSource, /href="\/app"/)
  assert.match(heroSource, /Launch App/)
})
