import test from "node:test"
import assert from "node:assert/strict"

import {
  footerContact,
  footerLegalLinks,
  footerQuickLinks,
  getLearnPage,
  getSupportPage,
  landingSections,
  learnPages,
  supportPages,
} from "./site-content.js"

test("site content registry exposes footer metadata and authored support links", () => {
  assert.deepEqual(
    footerQuickLinks.map((link) => link.href),
    ["/about", "/contact", "/faq", "/license"]
  )
  assert.deepEqual(
    footerQuickLinks.map((link) => link.label),
    ["About us", "Contact", "FAQ", "License"]
  )
  assert.deepEqual(
    footerLegalLinks.map((link) => link.href),
    ["/privacy-policy", "/terms-of-service"]
  )
  assert.deepEqual(
    footerLegalLinks.map((link) => link.label),
    ["Privacy Policy", "Terms of Service"]
  )
  assert.deepEqual(footerContact, {
    email: "sofiane.zidane.bentaleb@gmail.com",
    addressLines: ["47 boulevard de Pesaro, 92000", "Nanterre"],
  })
})

test("site content registry exposes support and learn page lookups", () => {
  assert.deepEqual(
    supportPages.map((page) => page.slug),
    ["about", "contact", "faq", "license", "privacy-policy", "terms-of-service"]
  )
  assert.equal(getSupportPage("about")?.title, "About us")
  assert.equal(getSupportPage("terms-of-service")?.title, "Terms of Service")
  assert.equal(getSupportPage("missing"), null)
  assert.equal(supportPages.length, 6)
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
  assert.equal(getLearnPage("boundless")?.title, "Boundless")
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
  assert.equal(getLearnPage("missing"), null)
  assert.equal(learnPages.length, 4)
})

test("site content registry keeps At All Times helpers absent from the module namespace", async () => {
  const module = await import("./site-content.js")

  assert.equal("shouldShowAtAllTimes" in module, false)
  assert.equal("getAtAllTimesLinks" in module, false)
  assert.deepEqual(
    landingSections.map((section) => section.id),
    ["hero", "how-it-works", "trading-tools", "lending-pools", "closing"]
  )
  assert.deepEqual(landingSections[0].artwork, {
    src: "/landing/winged-victory-of-samothrace.svg",
    alt: "Winged Victory of Samothrace artwork",
    caption: "Winged Victory of Samothrace",
  })
  assert.equal(landingSections[1].artwork.caption, "Louvre Pyramid")
  assert.equal(landingSections[2].artwork.caption, "The Seated Scribe")
  assert.deepEqual(landingSections[3].artwork, {
    src: "/landing/discobolus.svg",
    alt: "Discobolus artwork",
    caption: "Discobolus",
  })
  assert.equal(learnPages.length, 4)
})
