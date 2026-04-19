const landingArt = {
  wingedVictory: "/landing/winged-victory-of-samothrace.svg",
  louvrePyramid: "/landing/louvre-pyramid.svg",
  seatedScribe: "/landing/seated-scribe.svg",
  discobolus: "/landing/discobolus.svg",
}

export const footerLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/license", label: "License" },
]

export const landingSections = [
  {
    id: "hero",
    eyebrow: "XRPL-native DeFi stack",
    title: "Pyramid",
    lead:
      "XRPL-native lending, trading, and private execution arranged like an exhibition instead of a dashboard.",
    supporting:
      "Built on the native DEX and AMM, native lending with XLS-65 and XLS-66, and privacy primitives connected to Boundless and XLS-100.",
    artwork: {
      src: landingArt.wingedVictory,
      alt: "Winged Victory of Samothrace artwork",
      caption: "Winged Victory of Samothrace",
    },
  },
  {
    id: "how-it-works",
    eyebrow: "How it works",
    title: "Native DEX, AMM, and lending primitives.",
    body: [
      "Pyramid composes XRPL-native rails instead of wrapping them in a separate protocol layer.",
      "The page should explain DEX, AMM, vaults, and loans in that order, with the Louvre artwork carrying the section visually.",
    ],
    artwork: {
      src: landingArt.louvrePyramid,
      alt: "Louvre Pyramid artwork",
      caption: "Louvre Pyramid",
    },
  },
  {
    id: "trading-tools",
    eyebrow: "Trading tools",
    title: "Stop-loss, take-profit, trailing, and OCO without dashboard clutter.",
    body: [
      "This section reveals the tools as editorial annotations instead of boxed cards.",
      "The Scribe remains visually anchored while the text sequence explains the tools one by one.",
    ],
    artwork: {
      src: landingArt.seatedScribe,
      alt: "The Seated Scribe artwork",
      caption: "The Seated Scribe",
    },
  },
  {
    id: "lending-pools",
    eyebrow: "Lending pools",
    title: "XLS-65 and XLS-66 as the protocol core.",
    body: [
      "This is the last full protocol chapter before the closing section: vaults, loans, collateral flow, and the yield loop.",
      "Discobolus carries the lending screen so it feels deliberate and terminal, not like another repeated block before the page ends.",
    ],
    artwork: {
      src: landingArt.discobolus,
      alt: "Discobolus artwork",
      caption: "Discobolus",
    },
  },
  {
    id: "closing",
    eyebrow: "Boundless, XLS-100, and Hack the Block 2026",
    title: "Close on proof, authorship, and a clean handoff into the app.",
    body: [
      "The final block ties private execution to Boundless and XLS-100, introduces the builder, and frames Pyramid as the app built for Hack the Block 2026.",
      "This is also where the final Launch App CTA lives.",
    ],
  },
]

export const supportPages = [
  {
    slug: "about",
    href: "/about",
    title: "About us",
    eyebrow: "Builder and project",
    intro:
      "Pyramid is the result of an XRPL-native product thesis: use the ledger’s own primitives as the product, not as a backend detail.",
    sections: [
      {
        heading: "Who is behind it",
        body: [
          "This page introduces the builder in a more personal way than the landing page does.",
          "Keep the voice concise, direct, and tied to the product rather than sounding like a startup bio.",
        ],
      },
      {
        heading: "Why Pyramid exists",
        body: [
          "Explain why native XRPL lending, trading, and private execution belong together.",
          "Anchor the story in Hack the Block 2026 and the XRPL-native thesis.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    href: "/contact",
    title: "Contact",
    eyebrow: "Reach the project",
    intro:
      "This page exposes direct contact methods in a clean, minimal layout. It can launch with a short list, but the route itself is not optional.",
    sections: [
      {
        heading: "Primary contact methods",
        body: [
          "Reserve slots for email, GitHub, X, LinkedIn, or any other outbound destination the user decides to provide.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    href: "/faq",
    title: "FAQ",
    eyebrow: "Common questions",
    intro:
      "This page clarifies what Pyramid is, what is native to XRPL, what is educational content, and what still belongs to the current app surface.",
    sections: [
      {
        heading: "Suggested questions",
        body: [
          "What is Pyramid?",
          "What do XLS-65 and XLS-66 add to XRPL?",
          "Why does the site link to official docs?",
          "What is already live in the app today?",
        ],
      },
    ],
  },
  {
    slug: "license",
    href: "/license",
    title: "License",
    eyebrow: "Repository license",
    intro:
      "This page renders the project license and points back to the underlying LICENSE file in the repository.",
    sections: [],
  },
]

export const learnPages = [
  {
    slug: "xls-65-66",
    href: "/learn/xls-65-66",
    label: "XLS-65 / XLS-66",
    title: "XLS-65 and XLS-66",
    eyebrow: "Native lending on XRPL",
    summary:
      "Explain vaults and loans in plain language, then connect them back to Pyramid’s lending pools.",
    whyItMatters:
      "These amendments are the structural reason Pyramid can position lending as a native XRPL product layer instead of a contract wrapper.",
    officialLinks: [
      {
        href: "https://xrpl.org/docs/tutorials/how-tos/set-up-lending",
        label: "XRPL Set Up Lending",
      },
      {
        href: "https://xrpl.org/docs/concepts/tokens/single-asset-vaults",
        label: "XRPL Single Asset Vaults",
      },
      {
        href: "https://xrpl.org/docs/tutorials/defi/lending/use-the-lending-protocol/create-a-loan",
        label: "XRPL Create a Loan",
      },
    ],
  },
  {
    slug: "dex-amm",
    href: "/learn/dex-amm",
    label: "DEX / AMM",
    title: "DEX and AMM",
    eyebrow: "Native exchange rails",
    summary:
      "Explain the XRPL order-book DEX and AMM as complementary native exchange mechanisms.",
    whyItMatters:
      "Pyramid’s trading story only makes sense if visitors understand that XRPL already provides native exchange infrastructure.",
    officialLinks: [
      {
        href: "https://xrpl.org/docs/concepts/tokens/decentralized-exchange",
        label: "XRPL Decentralized Exchange",
      },
      {
        href: "https://xrpl.org/docs/tutorials/how-tos/use-tokens/create-an-automated-market-maker/",
        label: "XRPL Create an Automated Market Maker",
      },
    ],
  },
  {
    slug: "boundless",
    href: "/learn/boundless",
    label: "BOUNDLESS",
    title: "Boundless",
    eyebrow: "External proving market",
    summary:
      "Explain Boundless as the external proving/execution dependency in Pyramid’s privacy narrative, and label it clearly as an external system rather than an XRPL primitive.",
    whyItMatters:
      "This page explains the privacy layer without pretending Boundless is part of the XRP Ledger documentation itself.",
    officialLinks: [
      {
        href: "https://docs.boundless.network/developers/quick-start",
        label: "Boundless Quick Start",
      },
      {
        href: "https://github.com/boundless-xyz/xrpl-boundless-starter",
        label: "XRPL Boundless Starter",
      },
    ],
  },
  {
    slug: "xls-100",
    href: "/learn/xls-100",
    label: "XLS-100",
    title: "XLS-100 Smart Escrows",
    eyebrow: "Programmable escrow logic",
    summary:
      "Explain Smart Escrows in plain language before tying them to Pyramid’s private execution story.",
    whyItMatters:
      "This is how the site teaches visitors what XLS-100 adds before they encounter it in the closing section.",
    officialLinks: [
      {
        href: "https://xls.xrpl.org/xls/XLS-0100-smart-escrows.html",
        label: "XLS-0100 Smart Escrows",
      },
      {
        href: "https://xrpl.org/docs/tutorials/how-tos/use-specialized-payment-types/use-escrows/",
        label: "XRPL Use Escrows",
      },
    ],
  },
]

export function getSupportPage(slug) {
  return supportPages.find((page) => page.slug === slug) ?? null
}

export function getLearnPage(slug) {
  return learnPages.find((page) => page.slug === slug) ?? null
}

export function shouldShowAtAllTimes(pathname) {
  return pathname !== "/" && pathname !== "/app"
}

export function getAtAllTimesLinks() {
  return [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ]
}
