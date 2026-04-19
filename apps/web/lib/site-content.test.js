import test from "node:test"
import assert from "node:assert/strict"

import {
  footerLinks,
  getAtAllTimesLinks,
  getLearnPage,
  getSupportPage,
  landingSections,
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
  assert.deepEqual(
    supportPages.map((page) => page.slug),
    ["about", "contact", "faq", "license"]
  )
  assert.equal(getSupportPage("about")?.title, "About us")
  assert.equal(getSupportPage("missing"), null)
})

test("site content registry exposes learn pages and official links", () => {
  assert.deepEqual(
    learnPages.map((page) => page.slug),
    ["xls-65-66", "dex-amm", "boundless", "xls-100"]
  )
  assert.equal(getLearnPage("boundless")?.title, "Boundless")
  assert.equal(getLearnPage("missing"), null)
  assert.deepEqual(
    getLearnPage("xls-65-66")?.officialLinks?.map((link) => link.href),
    [
      "https://xrpl.org/docs/tutorials/how-tos/set-up-lending",
      "https://xrpl.org/docs/concepts/tokens/single-asset-vaults",
      "https://xrpl.org/docs/tutorials/defi/lending/use-the-lending-protocol/create-a-loan",
    ]
  )
  assert.deepEqual(
    getLearnPage("dex-amm")?.officialLinks?.map((link) => link.href),
    [
      "https://xrpl.org/docs/concepts/tokens/decentralized-exchange",
      "https://xrpl.org/docs/tutorials/how-tos/use-tokens/create-an-automated-market-maker/",
    ]
  )
  assert.deepEqual(
    getLearnPage("boundless")?.officialLinks?.map((link) => link.href),
    [
      "https://docs.boundless.network/developers/quick-start",
      "https://github.com/boundless-xyz/xrpl-boundless-starter",
    ]
  )
  assert.deepEqual(
    getLearnPage("xls-100")?.officialLinks?.map((link) => link.href),
    [
      "https://xls.xrpl.org/xls/XLS-0100-smart-escrows.html",
      "https://xrpl.org/docs/tutorials/how-tos/use-specialized-payment-types/use-escrows/",
    ]
  )
})

test("site content registry controls at-all-times links", () => {
  assert.equal(shouldShowAtAllTimes("/"), false)
  assert.equal(shouldShowAtAllTimes("/app"), false)
  assert.equal(shouldShowAtAllTimes("/about"), true)
  assert.equal(shouldShowAtAllTimes("/learn/xls-100"), true)
  assert.deepEqual(
    landingSections.map((section) => section.id),
    ["hero", "how-it-works", "trading-tools", "lending-pools", "closing"]
  )
  assert.deepEqual(landingSections[0].artwork, {
    src: "/landing/victoire-de-samothrace-dithered.svg",
    alt: "Victoire de Samothrace artwork",
  })
  assert.deepEqual(getAtAllTimesLinks(), [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ])
})
