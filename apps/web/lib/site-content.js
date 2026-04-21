const landingArt = {
  wingedVictory: "/landing/winged-victory-of-samothrace.svg",
  louvrePyramid: "/landing/louvre-pyramid.svg",
  seatedScribe: "/landing/seated-scribe.svg",
  discobolus: "/landing/discobolus.svg",
}

const supportContactEmail = "sofiane.zidane.bentaleb@gmail.com"

export const footerOverview =
  "Pyramid presents XRPL-native lending, trading, and privacy systems as a readable site before the live product begins."

export const footerQuickLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/license", label: "License" },
]

export const footerLegalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
]

export const footerContact = {
  email: supportContactEmail,
  addressLines: ["47 boulevard de Pesaro, 92000", "Nanterre"],
}

export const footerCopyright = "2026 Pyramid. All rights reserved."

export const supportContactLinks = [
  {
    label: "Email",
    href: `mailto:${supportContactEmail}`,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sofiane-ben-taleb/",
  },
  {
    label: "GitHub",
    href: "https://github.com/gamween",
  },
  {
    label: "X",
    href: "https://x.com/dvb_fianso",
  },
  {
    label: "Telegram",
    href: "https://t.me/dvb_fianso",
  },
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
      "Pyramid is my attempt to present XRPL-native lending, trading, and privacy as one readable product surface instead of a pile of disconnected protocol notes.",
    sections: [
      {
        heading: "Who I am",
        body: [
          "I am Sofiane Zidane Ben Taleb, the sole maintainer of this app and repository today. I work from a product and protocol angle: understand the primitive, then make it legible enough that people can decide whether it is useful.",
          "That bias shapes Pyramid. I care less about adding a glossy DeFi wrapper and more about showing what XRPL already makes possible when the mechanics are explained clearly.",
        ],
      },
      {
        heading: "Why I built Pyramid",
        body: [
          "I built Pyramid around a simple thesis: XRPL primitives should be the product story, not hidden implementation details. If native lending, DEX routing, AMM liquidity, and privacy layers belong together, the interface should teach that relationship instead of flattening it.",
          "The goal is not to simulate sophistication with dashboard noise. The goal is to reveal how XRPL-native systems fit together, where Boundless enters the picture, and what is live versus still exploratory.",
        ],
      },
      {
        heading: "Origin note",
        body: [
          "This repository descends from https://github.com/DVB-ESILV/Pyramid, a project built with Florian Gallot and Mehdi Mateo Tazi for Hack the Block 2026.",
          "That history matters, but the current app and this repository are maintained by me alone. The present-day product direction, editorial layer, and implementation work here are mine.",
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
      "If you want to discuss the product, the protocol thesis, the repo, or a concrete issue, contact me directly.",
    sections: [
      {
        heading: "What to contact me about",
        body: [
          "I welcome messages about XRPL-native lending and trading flows, Boundless and privacy questions, implementation bugs, repo feedback, research leads, and serious partnership or collaboration ideas.",
          "If you are reaching out about something specific, include the page, feature, or document you are referring to so I can respond with useful context instead of generic back-and-forth.",
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
      "Short answers to the questions that come up most often when people land on Pyramid for the first time.",
    sections: [
      {
        heading: "What is Pyramid?",
        body: [
          "Pyramid is a product thesis and app surface for XRPL-native lending, trading, and privacy-oriented execution. It treats those systems as one readable stack instead of separate protocol footnotes.",
        ],
      },
      {
        heading: "Is Pyramid built by one person or a team?",
        body: [
          "The current app and repository are maintained by Sofiane Zidane Ben Taleb alone. The project originated from an earlier hackathon collaboration, but this codebase is now single-author maintained.",
        ],
      },
      {
        heading: "What is live today?",
        body: [
          "The public site is live as an editorial and product layer. The /app route is the live product surface, but features and availability can evolve independently from the support pages.",
        ],
      },
      {
        heading: "What counts as educational content here?",
        body: [
          "The site explains XRPL concepts in plain language, but those summaries are not substitutes for the primary docs, amendment specs, or source repositories. They exist to make the stack easier to parse before you go deeper.",
        ],
      },
      {
        heading: "What do XLS-65 and XLS-66 add to XRPL?",
        body: [
          "They add native lending primitives, including the vault and loan structure that make XRPL-native lending flows possible without inventing a separate smart-contract wrapper for the core mechanism.",
        ],
      },
      {
        heading: "Why does the site link to XRPL and Boundless documentation?",
        body: [
          "Because Pyramid should point readers back to the source material. When I summarize a primitive or dependency, I also link to the official docs or repos so the explanation stays auditable.",
        ],
      },
      {
        heading: "Is Boundless part of XRPL?",
        body: [
          "No. Boundless is an external proving and execution system that appears in Pyramid’s privacy story, but it is not part of XRPL itself. The site keeps that distinction explicit on purpose.",
        ],
      },
      {
        heading: "How does this repo relate to the earlier hackathon project?",
        body: [
          "This repository descends from the Hack the Block 2026 project at https://github.com/DVB-ESILV/Pyramid. It keeps the lineage visible while reflecting a separate, current direction maintained by Sofiane alone.",
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
  {
    slug: "privacy-policy",
    href: "/privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Site privacy",
    intro:
      "This policy stays narrow on purpose: it describes the public site as it exists today, not a larger data posture that is not actually implemented.",
    sections: [
      {
        heading: "What this site currently collects",
        body: [
          "The public site is primarily informational. It does not ask you to create an account on these support pages, and it does not claim to collect more data than is necessary to serve the site and linked destinations.",
          "If analytics, embedded tools, or new forms are added later, this policy should be updated to describe them directly.",
        ],
      },
      {
        heading: "Direct contact handling",
        body: [
          "If you contact me by email or through another linked channel, I only receive the information you choose to send. I use it to reply, continue the conversation, or evaluate the issue or proposal you raised.",
          "I do not present direct contact as a hidden data funnel. If that changes, this page should change with it.",
        ],
      },
      {
        heading: "Third-party destinations",
        body: [
          "This site links to third-party services such as GitHub, LinkedIn, X, Telegram, XRPL documentation, and Boundless documentation. Once you leave Pyramid, those services handle your data under their own policies.",
        ],
      },
    ],
  },
  {
    slug: "terms-of-service",
    href: "/terms-of-service",
    title: "Terms of Service",
    eyebrow: "Site terms",
    intro:
      "These terms describe the narrow scope of the public Pyramid site and the current relationship between the editorial pages and the live app surface.",
    sections: [
      {
        heading: "Informational nature of the site",
        body: [
          "The support pages and landing content are informational. They explain product ideas, protocol primitives, and references, but they do not replace primary documentation, legal terms, or technical verification.",
        ],
      },
      {
        heading: "App route and feature availability",
        body: [
          "The /app route is the live product surface. Features, supported flows, and availability may change without the support pages updating in lockstep, so nothing here should be read as a permanent guarantee of implementation status.",
        ],
      },
      {
        heading: "External links and third-party systems",
        body: [
          "Pyramid links to external documentation, repositories, and services. Those destinations are governed by their own terms, licenses, and operational practices, and I am not responsible for how they behave once you leave this site.",
        ],
      },
    ],
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
