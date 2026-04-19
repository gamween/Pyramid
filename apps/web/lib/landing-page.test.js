import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

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
  assert.doesNotMatch(heroSource, /figcaption/)
  assert.match(heroSource, /LightRays/)
  assert.match(heroSource, /raysOrigin="right"/)
  assert.doesNotMatch(heroSource, /raysOrigin="bottom/)

  assert.doesNotMatch(storySource, /border museum-rule bg-\[/)
  assert.match(storySource, /mix-blend-multiply/)
  assert.match(storySource, /text-center/)
  assert.doesNotMatch(storySource, /figcaption/)
  assert.doesNotMatch(storySource, /lg:sticky/)
  assert.doesNotMatch(storySource, /lg:top-24/)
  assert.match(storySource, /LightRays/)
  assert.match(storySource, /raysOrigin=\{visualFirst \? "left" : "right"\}/)
  assert.doesNotMatch(storySource, /raysOrigin="bottom/)
})

test("landing typography and artwork scale stay restrained for viewport fit", () => {
  const heroSource = readSource("../components/site/landing/LandingHero.js")
  const storySource = readSource("../components/site/landing/StorySection.js")
  const closingSource = readSource("../components/site/landing/ClosingSection.js")

  assert.match(heroSource, /md:text-7xl/)
  assert.doesNotMatch(heroSource, /md:text-8xl/)
  assert.match(heroSource, /max-h-\[74vh\]/)

  assert.match(storySource, /md:text-5xl/)
  assert.doesNotMatch(storySource, /md:text-6xl/)
  assert.match(storySource, /max-h-\[68vh\]/)

  assert.match(closingSource, /md:text-5xl/)
  assert.match(closingSource, /xl:whitespace-nowrap/)
  assert.doesNotMatch(closingSource, /md:text-6xl/)
})

test("landing screen boundaries are explicit and footer copy stays on one line", () => {
  const sceneSource = readSource("../components/site/landing/LandingScene.js")
  const storySource = readSource("../components/site/landing/StorySection.js")
  const lendingSource = readSource("../components/site/landing/LendingSection.js")
  const closingSource = readSource("../components/site/landing/ClosingSection.js")
  const footerSource = readSource("../components/site/SiteFooter.js")

  assert.match(sceneSource, /gap-0/)
  assert.match(storySource, /border-t museum-rule/)
  assert.match(storySource, /lg:min-h-\[92svh\]/)
  assert.match(lendingSource, /border-t museum-rule/)
  assert.match(lendingSource, /lg:min-h-\[82svh\]/)
  assert.match(closingSource, /border-t museum-rule/)
  assert.match(closingSource, /lg:min-h-\[72svh\]/)
  assert.match(footerSource, /xl:whitespace-nowrap/)
})

test("app branding uses the samothrace mark for header logo and favicon", () => {
  const headerSource = readSource("../components/Header.js")
  const layoutSource = readSource("../app/layout.js")
  const brandPath = new URL("../public/brand/winged-victory-of-samothrace.png", import.meta.url)

  assert.match(headerSource, /src="\/brand\/winged-victory-of-samothrace\.png"/)
  assert.doesNotMatch(headerSource, /src="\/logo\.png"/)
  assert.doesNotMatch(headerSource, /samothrace-mark\.svg/)

  assert.match(layoutSource, /brand\/winged-victory-of-samothrace\.png/)
  assert.doesNotMatch(layoutSource, /icon-light\.png/)
  assert.doesNotMatch(layoutSource, /icon-dark\.png/)
  assert.doesNotMatch(layoutSource, /samothrace-mark\.svg/)

  assert.equal(existsSync(brandPath), true)
})

test("lending section uses the discobolus artwork with the same editorial treatment", () => {
  const lendingSource = readSource("../components/site/landing/LendingSection.js")

  assert.match(lendingSource, /section\.artwork\.src/)
  assert.match(lendingSource, /<Image/)
  assert.match(lendingSource, /mix-blend-multiply/)
  assert.match(lendingSource, /border-t museum-rule/)
  assert.doesNotMatch(lendingSource, /figcaption/)
  assert.match(lendingSource, /lg:grid-cols-\[minmax\(0,1\.02fr\)_minmax\(0,0\.98fr\)\]/)
  assert.match(lendingSource, /className="max-w-3xl lg:order-2"/)
  assert.match(lendingSource, /className="relative mt-12 text-center lg:order-1 lg:mt-0 lg:self-start"/)
  assert.match(lendingSource, /font-display text-3xl leading-none">\{String\(index \+ 1\)\.padStart\(2, "0"\)\}/)
  assert.match(lendingSource, /font-ui text-\[10px\] uppercase tracking-\[0\.18em\]">\{pillar\.label\}/)
  assert.match(lendingSource, /LightRays/)
  assert.match(lendingSource, /raysOrigin="left"/)
  assert.doesNotMatch(lendingSource, /raysOrigin="bottom/)
})

test("light rays component is installed locally with ogl and non-interactive canvas styling", () => {
  const lightRaysSource = readSource("../components/effects/LightRays.js")
  const lightRaysCssSource = readSource("../components/effects/LightRays.module.css")

  assert.match(lightRaysSource, /from "ogl"/)
  assert.match(lightRaysSource, /IntersectionObserver/)
  assert.match(lightRaysSource, /light-rays-container/)
  assert.match(lightRaysCssSource, /\.light-rays-container/)
  assert.match(lightRaysCssSource, /pointer-events:\s*none/)
  assert.match(lightRaysCssSource, /overflow:\s*hidden/)
})
