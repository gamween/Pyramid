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

test("landing scene uses the full page width instead of a centered max-width shell", () => {
  const sceneSource = readSource("../components/site/landing/LandingScene.js")
  const headerSource = readSource("../components/site/SiteHeader.js")
  const footerSource = readSource("../components/site/SiteFooter.js")

  assert.doesNotMatch(sceneSource, /max-w-7xl/)
  assert.doesNotMatch(sceneSource, /mx-auto/)
  assert.doesNotMatch(headerSource, /max-w-7xl/)
  assert.doesNotMatch(headerSource, /mx-auto/)
  assert.doesNotMatch(footerSource, /max-w-7xl/)
  assert.doesNotMatch(footerSource, /mx-auto/)
})

test("active repo references point to gamween/Pyramid", () => {
  const contactSource = readSource("../app/contact/page.js")
  const readmeSource = readSource("../../../README.md")
  const contributingSource = readSource("../../../CONTRIBUTING.md")

  assert.match(contactSource, /https:\/\/github\.com\/gamween\/Pyramid/)
  assert.match(contactSource, /github\.com\/gamween\/Pyramid/)
  assert.doesNotMatch(contactSource, /DVB-ESILV\/Pyramid/)

  assert.match(readmeSource, /https:\/\/github\.com\/gamween\/Pyramid/)
  assert.doesNotMatch(readmeSource, /DVB-ESILV\/Pyramid/)

  assert.match(contributingSource, /https:\/\/github\.com\/gamween\/Pyramid\.git/)
  assert.doesNotMatch(contributingSource, /DVB-ESILV\/Pyramid/)
})

test("app experience stays edge-to-edge without a centered max-width shell", () => {
  const appExperienceSource = readSource("../components/app/AppExperience.js")
  const headerSource = readSource("../components/Header.js")
  const earnYieldSource = readSource("../components/EarnYieldPage.js")

  assert.match(appExperienceSource, /<main className="flex-1 w-full/)
  assert.match(appExperienceSource, /<AppPanels \/>/)
  assert.doesNotMatch(appExperienceSource, /max-w-7xl/)
  assert.doesNotMatch(appExperienceSource, /mx-auto/)

  assert.doesNotMatch(headerSource, /container mx-auto/)
  assert.doesNotMatch(earnYieldSource, /max-w-4xl mx-auto/)
})

test("landing artwork is integrated with blend treatment instead of white panels", () => {
  const heroSource = readSource("../components/site/landing/LandingHero.js")
  const storySource = readSource("../components/site/landing/StorySection.js")

  assert.doesNotMatch(heroSource, /bg-\[rgba\(255,255,255,0\.24\)\]/)
  assert.match(heroSource, /mix-blend-multiply/)
  assert.match(heroSource, /text-center/)
  assert.doesNotMatch(heroSource, /rounded-full border border-black\/10/)
  assert.match(heroSource, /section\.artwork\.caption/)

  assert.doesNotMatch(storySource, /border museum-rule bg-\[/)
  assert.match(storySource, /mix-blend-multiply/)
  assert.match(storySource, /section\.artwork\.caption/)
  assert.match(storySource, /text-center/)
})
