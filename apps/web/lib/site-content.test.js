import test from "node:test"
import assert from "node:assert/strict"

import {
  footerLinks,
  getAtAllTimesLinks,
  getLearnPage,
  getSupportPage,
  learnPages,
  shouldShowAtAllTimes,
  supportPages,
} from "./site-content.js"

test("site content registry exposes footer and support content", () => {
  assert.deepEqual(
    footerLinks.map((link) => link.href),
    ["/about", "/contact", "/faq", "/license"]
  )
  assert.deepEqual(
    footerLinks.map((link) => link.label),
    ["About us", "Contact", "FAQ", "License"]
  )
  assert.equal(supportPages.length, 4)
  assert.equal(getSupportPage("about")?.title, "About us")
})

test("site content registry exposes learn pages and official links", () => {
  assert.deepEqual(
    learnPages.map((page) => page.slug),
    ["xls-65-66", "dex-amm", "boundless", "xls-100"]
  )
  assert.equal(getLearnPage("boundless")?.title, "Boundless")
  assert.deepEqual(getLearnPage("boundless")?.officialLinks?.map((link) => link.href), [
    "https://docs.boundless.network/developers/quick-start",
    "https://github.com/boundless-xyz/xrpl-boundless-starter",
  ])
})

test("site content registry controls at-all-times links", () => {
  assert.equal(shouldShowAtAllTimes("/"), false)
  assert.equal(shouldShowAtAllTimes("/app"), false)
  assert.equal(shouldShowAtAllTimes("/about"), true)
  assert.equal(shouldShowAtAllTimes("/learn/xls-100"), true)
  assert.deepEqual(getAtAllTimesLinks(), [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ])
})
