const landingArt = {
  victory: "/landing/victoire-de-samothrace-dithered.svg",
  pyramid: "/landing/pyramide-du-louvre-dithered.svg",
  scribe: "/landing/le-scribe-accroupi-dithered.svg",
}

export const supportPages = [
  {
    slug: "about",
    title: "About us",
    href: "/about",
    summary: "Why the landing page exists and how the product is positioned.",
  },
  {
    slug: "contact",
    title: "Contact",
    href: "/contact",
    summary: "Ways to reach the team.",
  },
  {
    slug: "faq",
    title: "FAQ",
    href: "/faq",
    summary: "Common questions about the product and the landing experience.",
  },
  {
    slug: "license",
    title: "License",
    href: "/license",
    summary: "The licensing terms for the project.",
  },
]

export const footerLinks = supportPages.map(({ href, title }) => ({
  href,
  label: title,
}))

export const landingSections = [
  {
    id: "hero",
    title: "Trade, lend, and manage liquidity on XRPL",
    image: landingArt.victory,
    description: "A landing page built around the core actions users take in the app.",
  },
  {
    id: "how-it-works",
    title: "How it works",
    image: landingArt.pyramid,
    description: "Explain the flow from wallet connection to execution.",
  },
  {
    id: "trading-tools",
    title: "Trading tools",
    image: landingArt.scribe,
    description: "Highlight swap, order, and execution tools.",
  },
  {
    id: "lending-pools",
    title: "Lending pools",
    image: landingArt.victory,
    description: "Describe lending and liquidity-backed actions.",
  },
  {
    id: "closing",
    title: "Closing",
    image: landingArt.pyramid,
    description: "End with a concise call to action.",
  },
]

export const learnPages = [
  {
    slug: "xls-65-66",
    title: "XLS-65/66",
    href: "/learn/xls-65-66",
    officialLinks: [
      { href: "https://xrpl.org/docs/tutorials/how-tos/set-up-lending", label: "Set up lending" },
      {
        href: "https://xrpl.org/docs/concepts/tokens/single-asset-vaults",
        label: "Single-asset vaults",
      },
      {
        href: "https://xrpl.org/docs/tutorials/defi/lending/use-the-lending-protocol/create-a-loan",
        label: "Create a loan",
      },
    ],
  },
  {
    slug: "dex-amm",
    title: "DEX and AMM",
    href: "/learn/dex-amm",
    officialLinks: [
      {
        href: "https://xrpl.org/docs/concepts/tokens/decentralized-exchange",
        label: "Decentralized exchange",
      },
      {
        href: "https://xrpl.org/docs/tutorials/how-tos/use-tokens/create-an-automated-market-maker/",
        label: "Create an automated market maker",
      },
    ],
  },
  {
    slug: "boundless",
    title: "Boundless",
    href: "/learn/boundless",
    officialLinks: [
      {
        href: "https://docs.boundless.network/developers/quick-start",
        label: "Quick start",
      },
      {
        href: "https://github.com/boundless-xyz/xrpl-boundless-starter",
        label: "Starter repository",
      },
    ],
  },
  {
    slug: "xls-100",
    title: "XLS-100",
    href: "/learn/xls-100",
    officialLinks: [
      {
        href: "https://xls.xrpl.org/xls/XLS-0100-smart-escrows.html",
        label: "XLS-0100 smart escrows",
      },
      {
        href: "https://xrpl.org/docs/tutorials/how-tos/use-specialized-payment-types/use-escrows/",
        label: "Use escrows",
      },
    ],
  },
]

const supportPageBySlug = new Map(supportPages.map((page) => [page.slug, page]))
const learnPageBySlug = new Map(learnPages.map((page) => [page.slug, page]))

export function getSupportPage(slug) {
  return supportPageBySlug.get(slug)
}

export function getLearnPage(slug) {
  return learnPageBySlug.get(slug)
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
