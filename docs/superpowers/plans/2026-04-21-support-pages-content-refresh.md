# Support Pages Content Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder support/legal page copy with real single-author content, move Sofiane's portrait into the app's public assets for `About us`, and remove the obsolete `At All Times` return control from the shared site layout.

**Architecture:** Keep the existing support-page route structure and shared `ContentPageLayout`, but simplify that layout so it uses only the standard site header and footer. Centralize all support-page copy and contact metadata in `apps/web/lib/site-content.js`, then render the richer content through the existing page entrypoints while adding a dedicated portrait section to `About us`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS, `next/image`, `node:test`

---

## File Structure

- Modify: `apps/web/lib/site-content.js`
  Replace placeholder support-page copy with real authored content, add direct contact link metadata, remove `At All Times` helpers, and keep footer/support registries as the single source of truth.
- Modify: `apps/web/lib/site-content.test.js`
  Update registry expectations to remove `At All Times` behavior and verify the new support metadata.
- Modify: `apps/web/lib/site-shell.test.js`
  Replace tests for `AtAllTimesMenu` and header reservation with tests for the simplified shared layout and header.
- Modify: `apps/web/lib/support-pages.test.js`
  Extend support-page assertions to cover the new about portrait and the retained shared layout entrypoints.
- Modify: `apps/web/components/site/ContentPageLayout.js`
  Remove the floating return control and the special header spacing path.
- Modify: `apps/web/components/site/SiteHeader.js`
  Delete `reserveAtAllTimesSpace` logic and return to a single shared header layout.
- Delete: `apps/web/components/site/AtAllTimesMenu.js`
  Remove the obsolete secondary navigation component entirely.
- Modify: `apps/web/app/about/page.js`
  Add the portrait section and any About-specific external links or origin note presentation that should not live in the generic layout.
- Modify: `apps/web/app/contact/page.js`
  Replace the repository-only extra section with real direct contact links.
- Modify: `apps/web/app/license/page.js`
  Add the short human-readable preface before the license text.
- Create or Modify: `apps/web/app/privacy-policy/page.js`
  Keep the shared layout route but ensure it renders the new factual privacy content cleanly.
- Create or Modify: `apps/web/app/terms-of-service/page.js`
  Keep the shared layout route but ensure it renders the new factual terms content cleanly.
- Create: `apps/web/public/about/sofiane-zidane-ben-taleb.jpg`
  Public portrait asset moved from the repository root.
- Delete: `fianso.jpg`
  Remove the untracked root-level portrait once it has been moved into the app.

## Task 1: Lock the new support-page and layout behavior in tests

**Files:**
- Modify: `apps/web/lib/site-content.test.js`
- Modify: `apps/web/lib/site-shell.test.js`
- Modify: `apps/web/lib/support-pages.test.js`
- Test: `apps/web/lib/site-content.test.js`
- Test: `apps/web/lib/site-shell.test.js`
- Test: `apps/web/lib/support-pages.test.js`

- [ ] **Step 1: Write the failing registry and layout expectations**

```js
test("site content registry exposes authored support metadata without At All Times helpers", () => {
  assert.deepEqual(
    footerQuickLinks.map((link) => link.href),
    ["/about", "/contact", "/faq", "/license"]
  )
  assert.deepEqual(footerContact, {
    email: "sofiane.zidane.bentaleb@gmail.com",
    addressLines: ["47 boulevard de Pesaro, 92000", "Nanterre"],
  })
  assert.equal("shouldShowAtAllTimes" in await import("./site-content.js"), false)
  assert.equal("getAtAllTimesLinks" in await import("./site-content.js"), false)
})

test("shared content layout no longer renders At All Times spacing logic", () => {
  const headerSource = readFileSync(new URL("../components/site/SiteHeader.js", import.meta.url), "utf8")
  const layoutSource = readFileSync(
    new URL("../components/site/ContentPageLayout.js", import.meta.url),
    "utf8"
  )

  assert.doesNotMatch(layoutSource, /AtAllTimesMenu/)
  assert.doesNotMatch(layoutSource, /reserveAtAllTimesSpace/)
  assert.doesNotMatch(headerSource, /reserveAtAllTimesSpace/)
})

test("about page references the dedicated portrait asset", () => {
  const source = readSource("../app/about/page.js")

  assert.match(source, /next\/image/)
  assert.match(source, /\/about\/sofiane-zidane-ben-taleb\.jpg/)
})
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `pnpm --filter web exec node --test lib/site-content.test.js lib/site-shell.test.js lib/support-pages.test.js`

Expected:
- FAIL because `site-content.js` still exports `shouldShowAtAllTimes` and `getAtAllTimesLinks`
- FAIL because `ContentPageLayout.js` still imports `AtAllTimesMenu`
- FAIL because `about/page.js` does not yet render the portrait asset

- [ ] **Step 3: Expand the test files with the new exact assertions**

```js
// apps/web/lib/site-content.test.js
import {
  footerContact,
  footerLegalLinks,
  footerQuickLinks,
  getLearnPage,
  getSupportPage,
  learnPages,
  supportPages,
} from "./site-content.js"

test("site content registry exposes authored support metadata without At All Times helpers", async () => {
  const module = await import("./site-content.js")

  assert.deepEqual(
    footerQuickLinks.map((link) => link.href),
    ["/about", "/contact", "/faq", "/license"]
  )
  assert.deepEqual(
    footerLegalLinks.map((link) => link.href),
    ["/privacy-policy", "/terms-of-service"]
  )
  assert.deepEqual(footerContact, {
    email: "sofiane.zidane.bentaleb@gmail.com",
    addressLines: ["47 boulevard de Pesaro, 92000", "Nanterre"],
  })
  assert.equal(module.shouldShowAtAllTimes, undefined)
  assert.equal(module.getAtAllTimesLinks, undefined)
  assert.equal(getSupportPage("about")?.title, "About us")
  assert.equal(getSupportPage("terms-of-service")?.title, "Terms of Service")
  assert.equal(supportPages.length, 6)
  assert.equal(getLearnPage("boundless")?.title, "Boundless")
  assert.equal(learnPages.length, 4)
})
```

```js
// apps/web/lib/site-shell.test.js
test("shared content layout uses the standard site header without At All Times chrome", () => {
  const headerSource = readFileSync(new URL("../components/site/SiteHeader.js", import.meta.url), "utf8")
  const layoutSource = readFileSync(
    new URL("../components/site/ContentPageLayout.js", import.meta.url),
    "utf8"
  )

  assert.doesNotMatch(layoutSource, /AtAllTimesMenu/)
  assert.match(layoutSource, /<SiteHeader \/>/)
  assert.doesNotMatch(layoutSource, /reserveAtAllTimesSpace/)
  assert.doesNotMatch(headerSource, /reserveAtAllTimesSpace/)
  assert.match(headerSource, /href="\/"/)
  assert.match(headerSource, /href="\/app"/)
})
```

```js
// apps/web/lib/support-pages.test.js
test("about page renders the dedicated portrait asset", () => {
  const source = readSource("../app/about/page.js")

  assert.match(source, /next\/image/)
  assert.match(source, /\/about\/sofiane-zidane-ben-taleb\.jpg/)
})
```

- [ ] **Step 4: Run the focused tests again to confirm the failures are still the right ones**

Run: `pnpm --filter web exec node --test lib/site-content.test.js lib/site-shell.test.js lib/support-pages.test.js`

Expected:
- FAIL only on the still-unimplemented layout/content behavior
- No syntax errors
- No unrelated test failures

- [ ] **Step 5: Commit the red test state**

```bash
git add apps/web/lib/site-content.test.js apps/web/lib/site-shell.test.js apps/web/lib/support-pages.test.js
git commit -m "test: cover support page content refresh"
```

## Task 2: Remove the obsolete At All Times navigation layer

**Files:**
- Modify: `apps/web/components/site/ContentPageLayout.js`
- Modify: `apps/web/components/site/SiteHeader.js`
- Modify: `apps/web/lib/site-content.js`
- Delete: `apps/web/components/site/AtAllTimesMenu.js`
- Test: `apps/web/lib/site-shell.test.js`
- Test: `apps/web/lib/site-content.test.js`

- [ ] **Step 1: Run the focused tests before editing implementation**

Run: `pnpm --filter web exec node --test lib/site-content.test.js lib/site-shell.test.js`

Expected: FAIL on `At All Times`-related expectations

- [ ] **Step 2: Remove the At All Times helpers from the site-content module**

```js
// Delete these exports from apps/web/lib/site-content.js
export function shouldShowAtAllTimes(pathname) {
  return pathname !== "/" && pathname !== "/app"
}

export function getAtAllTimesLinks() {
  return [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ]
}
```

- [ ] **Step 3: Simplify the shared content layout**

```js
// apps/web/components/site/ContentPageLayout.js
import { SiteFooter } from "./SiteFooter"
import { SiteHeader } from "./SiteHeader"

export function ContentPageLayout({ eyebrow, title, intro, sections, officialLinks = [], children }) {
  return (
    <div className="museum-shell min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-14 md:px-10 md:pt-16">
        <p className="font-ui text-[11px] uppercase tracking-[0.22em]">{eyebrow}</p>
        <h1 className="font-display mt-4 max-w-[11ch] text-5xl leading-[0.92] md:text-7xl">
          {title}
        </h1>
        <p className="museum-copy mt-6 max-w-3xl text-lg leading-8 md:text-xl">{intro}</p>
        {/* existing sections / officialLinks / children remain */}
      </main>

      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 4: Simplify the shared site header**

```js
// apps/web/components/site/SiteHeader.js
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="museum-shell sticky top-0 z-40 border-b museum-rule">
      <div className="flex w-full items-center justify-between px-4 py-5 md:px-8 lg:px-10">
        <Link
          href="/"
          className="font-ui text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70"
        >
          Pyramid
        </Link>
        <Link
          href="/app"
          className="border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
        >
          Launch App
        </Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Delete the obsolete component and rerun focused tests**

Run:
`rm apps/web/components/site/AtAllTimesMenu.js`
`pnpm --filter web exec node --test lib/site-content.test.js lib/site-shell.test.js`

Expected: PASS

- [ ] **Step 6: Commit the navigation cleanup**

```bash
git add apps/web/components/site/ContentPageLayout.js apps/web/components/site/SiteHeader.js apps/web/lib/site-content.js apps/web/lib/site-content.test.js apps/web/lib/site-shell.test.js
git rm apps/web/components/site/AtAllTimesMenu.js
git commit -m "refactor: remove support page return control"
```

## Task 3: Move the portrait asset and enrich the support-page content registry

**Files:**
- Modify: `apps/web/lib/site-content.js`
- Create: `apps/web/public/about/sofiane-zidane-ben-taleb.jpg`
- Delete: `fianso.jpg`
- Test: `apps/web/lib/site-content.test.js`

- [ ] **Step 1: Run the registry tests before changing the support-page content**

Run: `pnpm --filter web exec node --test lib/site-content.test.js`

Expected: FAIL because the support page copy and contact metadata are still placeholder-level

- [ ] **Step 2: Move the portrait asset into the public tree**

Run:
`mkdir -p apps/web/public/about`
`mv fianso.jpg apps/web/public/about/sofiane-zidane-ben-taleb.jpg`

Expected:
- `apps/web/public/about/sofiane-zidane-ben-taleb.jpg` exists
- `fianso.jpg` no longer exists at the repository root

- [ ] **Step 3: Replace the support-page registry copy with real single-author content**

```js
// apps/web/lib/site-content.js
export const supportPages = [
  {
    slug: "about",
    href: "/about",
    title: "About us",
    eyebrow: "Builder and project",
    intro:
      "I built Pyramid as a way to present XRPL-native lending, trading, and privacy as one readable product surface instead of a pile of disconnected protocol features.",
    sections: [
      {
        heading: "Who I am",
        body: [
          "I am Sofiane Zidane Ben Taleb, and I build products by starting from protocol mechanics rather than interface fashion.",
          "With Pyramid, I wanted the site and the app to make XRPL-native finance feel legible, precise, and intentional.",
        ],
      },
      {
        heading: "Why I built Pyramid",
        body: [
          "The core idea behind Pyramid is simple: if XRPL already exposes native primitives for exchange, lending, escrow, and programmable execution, the product should reveal that clearly instead of hiding it behind synthetic abstractions.",
          "That is why Pyramid combines native lending, advanced trading, and educational protocol pages in one system.",
        ],
      },
      {
        heading: "Origin note",
        body: [
          "This repository stands on its own, but it acknowledges an earlier fork: DVB-ESILV/Pyramid, a project I built with Florian Gallot and Mehdi Mateo Tazi for Hack the Block 2026.",
          "The current app, site, and repository are now maintained by me alone.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    href: "/contact",
    title: "Contact",
    eyebrow: "Reach the builder",
    intro:
      "If you want to discuss Pyramid, XRPL-native product design, or the reasoning behind the app, you are reaching me directly.",
    sections: [
      {
        heading: "What to contact me about",
        body: [
          "You can contact me about Pyramid itself, XRPL-native lending and trading, hackathon follow-up, demos, research questions, or collaboration around the product.",
          "If your message is specific, technical, and grounded in the product, I will understand it faster.",
        ],
      },
    ],
  },
  // keep FAQ, License, Privacy Policy, and Terms of Service aligned with the approved spec
]

export const supportContactLinks = [
  { href: "mailto:sofiane.zidane.bentaleb@gmail.com", label: "sofiane.zidane.bentaleb@gmail.com" },
  { href: "https://www.linkedin.com/in/sofiane-ben-taleb/", label: "LinkedIn" },
  { href: "https://github.com/gamween", label: "GitHub" },
  { href: "https://x.com/dvb_fianso", label: "X" },
  { href: "https://t.me/dvb_fianso", label: "Telegram" },
]
```

- [ ] **Step 4: Update the registry test with exact new expectations**

```js
assert.equal(getSupportPage("about")?.sections[0].heading, "Who I am")
assert.equal(getSupportPage("contact")?.eyebrow, "Reach the builder")
assert.equal(getSupportPage("faq")?.sections.length >= 1, true)
assert.equal(getSupportPage("privacy-policy")?.sections.length, 3)
assert.equal(getSupportPage("terms-of-service")?.sections.length, 3)
```

- [ ] **Step 5: Run the registry tests to verify the new content model passes**

Run: `pnpm --filter web exec node --test lib/site-content.test.js`

Expected: PASS

- [ ] **Step 6: Commit the content registry and portrait asset move**

```bash
git add apps/web/lib/site-content.js apps/web/lib/site-content.test.js apps/web/public/about/sofiane-zidane-ben-taleb.jpg
git rm fianso.jpg
git commit -m "feat: author support page content"
```

## Task 4: Render the new support-page content in the route entrypoints

**Files:**
- Modify: `apps/web/app/about/page.js`
- Modify: `apps/web/app/contact/page.js`
- Modify: `apps/web/app/license/page.js`
- Modify: `apps/web/app/privacy-policy/page.js`
- Modify: `apps/web/app/terms-of-service/page.js`
- Modify: `apps/web/lib/support-pages.test.js`
- Test: `apps/web/lib/support-pages.test.js`

- [ ] **Step 1: Run the support-page test file before implementation**

Run: `pnpm --filter web exec node --test lib/support-pages.test.js`

Expected: FAIL because `about/page.js` does not render `next/image` and `contact/page.js` still renders the repository-only extra section

- [ ] **Step 2: Add the portrait section to the About page**

```js
// apps/web/app/about/page.js
import Image from "next/image"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

export default function AboutPage() {
  const page = getSupportPage("about")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule grid gap-8 pt-8 md:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] md:items-start">
        <div className="relative max-w-sm overflow-hidden">
          <Image
            src="/about/sofiane-zidane-ben-taleb.jpg"
            alt="Portrait of Sofiane Zidane Ben Taleb"
            width={960}
            height={1200}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
        <div className="museum-copy space-y-4 text-lg leading-8">
          <p>Pyramid is the product surface I use to make XRPL-native finance readable.</p>
          <p>
            This repository acknowledges its origin in an earlier hackathon fork, but the current app
            and site are my work and are maintained by me alone.
          </p>
        </div>
      </section>
    </ContentPageLayout>
  )
}
```

- [ ] **Step 3: Replace the Contact page extra section with real direct links**

```js
// apps/web/app/contact/page.js
import Link from "next/link"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage, supportContactLinks } from "../../lib/site-content"

export default function ContactPage() {
  const page = getSupportPage("contact")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <h2 className="font-display text-3xl md:text-5xl">Direct channels</h2>
        <div className="mt-6 flex flex-col items-start gap-4">
          {supportContactLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className="font-body text-lg leading-8 text-[color:var(--museum-muted)] transition-colors hover:text-[color:var(--museum-ink)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </ContentPageLayout>
  )
}
```

- [ ] **Step 4: Add the license preface and leave privacy/terms on the shared layout**

```js
// apps/web/app/license/page.js
<section className="border-t museum-rule pt-8">
  <h2 className="font-display text-3xl md:text-5xl">How to read this page</h2>
  <div className="museum-copy mt-4 space-y-4 text-lg leading-8">
    <p>The code in this repository is covered by the project license shown below.</p>
    <p>Linked third-party documentation, platforms, and external services keep their own terms and licenses.</p>
  </div>
</section>
```

- [ ] **Step 5: Rerun the support-page tests**

Run: `pnpm --filter web exec node --test lib/support-pages.test.js`

Expected: PASS

- [ ] **Step 6: Commit the route-level page rendering changes**

```bash
git add apps/web/app/about/page.js apps/web/app/contact/page.js apps/web/app/license/page.js apps/web/app/privacy-policy/page.js apps/web/app/terms-of-service/page.js apps/web/lib/support-pages.test.js
git commit -m "feat: render support pages with authored content"
```

## Task 5: Full verification and final cleanup

**Files:**
- Modify: `apps/web/lib/landing-page.test.js` (only if shared layout assertions need to be updated)
- Test: `apps/web`

- [ ] **Step 1: Run the full web test suite**

Run: `pnpm --filter web test`

Expected: PASS with all `node:test` suites green

- [ ] **Step 2: Run the linter**

Run: `pnpm --filter web lint`

Expected: PASS with no lint errors

- [ ] **Step 3: Run the production build**

Run: `pnpm --filter web build`

Expected:
- PASS
- the existing `baseline-browser-mapping` freshness warning may still appear
- no build failures

- [ ] **Step 4: Review git status for stray files**

Run: `git status --short`

Expected:
- no unexpected untracked files
- no leftover root-level portrait file

- [ ] **Step 5: Commit the final verification-safe state**

```bash
git add -A
git commit -m "chore: finalize support pages content refresh"
```

## Self-Review

- **Spec coverage:** This plan covers all six support/legal pages, the single-author voice, the portrait move, the short origin note, the factual privacy/terms pages, and the full removal of the `At All Times` navigation layer.
- **Placeholder scan:** The implementation snippets are concrete, the commands are explicit, and each task includes its own verification and commit step.
- **Type consistency:** The plan consistently uses `supportContactLinks`, `ContentPageLayout`, `SiteHeader`, and the final portrait path `"/about/sofiane-zidane-ben-taleb.jpg"` throughout.
