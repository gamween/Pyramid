# Pyramid Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed landing/app homepage with a museum-editorial landing page at `/`, preserve the existing product surface at `/app`, and add educational/supporting content pages with persistent secondary navigation.

**Architecture:** Keep the current XRPL app internals intact by extracting the launched-state UI into `/app`, then build a separate marketing/content system on top of the existing Next.js App Router. Drive the landing page, support pages, and educational pages from tested data modules so copy, links, route structure, and `At All Times` behavior stay explicit and easy to revise.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS, Framer Motion, next/font/google, node:test

---

## File Structure

- Modify: `apps/web/package.json`
  Add a `test` script so the existing `node:test` suites and new site/app metadata tests run through `pnpm --filter web test`.
- Modify: `apps/web/app/layout.js`
  Convert the root layout into a server layout that only owns fonts, metadata, and global document classes.
- Modify: `apps/web/app/globals.css`
  Add the yellow/black museum palette, font utility classes, long-form content styles, and app-shell override classes.
- Modify: `apps/web/app/page.js`
  Replace the current mixed homepage with the new landing route.
- Create: `apps/web/app/app/layout.js`
  App-only dark wrapper with `WalletProvider` and `PrismBackground`.
- Create: `apps/web/app/app/page.js`
  Route that mounts the extracted current app experience.
- Create: `apps/web/app/about/page.js`
- Create: `apps/web/app/contact/page.js`
- Create: `apps/web/app/faq/page.js`
- Create: `apps/web/app/license/page.js`
- Create: `apps/web/app/learn/[slug]/page.js`
  Supporting and educational routes required by the approved design.
- Create: `apps/web/components/app/AppExperience.js`
  Extract the current launched-state UI from the old homepage.
- Create: `apps/web/components/app/AppTabsNav.js`
  Current tabs navigation moved into a dedicated reusable app component.
- Create: `apps/web/components/app/AppPanels.js`
  Current dashboard/lending/loans/trading tab content moved out of the homepage.
- Create: `apps/web/components/site/SiteHeader.js`
  Landing-only header with wordmark and `Launch App`.
- Create: `apps/web/components/site/SiteFooter.js`
  Shared footer links for landing and content pages.
- Create: `apps/web/components/site/AtAllTimesMenu.js`
  Fixed secondary-page control that exposes `Landing Page` and `Open App`.
- Create: `apps/web/components/site/ContentPageLayout.js`
  Shared layout for `About us`, `Contact`, `FAQ`, `License`, and `/learn/*` pages.
- Create: `apps/web/components/site/TermLinksRow.js`
  Clickable utility strip for `XLS-65 / XLS-66`, `DEX / AMM`, `BOUNDLESS`, and `XLS-100`.
- Create: `apps/web/components/site/landing/LandingScene.js`
- Create: `apps/web/components/site/landing/LandingHero.js`
- Create: `apps/web/components/site/landing/StorySection.js`
- Create: `apps/web/components/site/landing/LendingSection.js`
- Create: `apps/web/components/site/landing/ClosingSection.js`
  Landing-page storytelling components.
- Create: `apps/web/lib/site-content.js`
  Canonical content/route registry for landing sections, footer links, support pages, and educational pages.
- Create: `apps/web/lib/site-content.test.js`
  Tests for route slugs, official links, footer links, and `At All Times` visibility rules.
- Create: `apps/web/lib/app-shell.js`
  Canonical tab metadata and default app tab for `/app`.
- Create: `apps/web/lib/app-shell.test.js`
  Tests that lock the extracted `/app` shell to the current tab surface.
- Delete: `apps/web/components/LandingPresentation.js`
- Delete: `apps/web/components/FeatureShowcase.js`
- Delete: `apps/web/components/TechStats.js`
- Delete: `apps/web/components/LiquidChrome.js`
- Delete: `apps/web/components/LiquidChrome.css`
- Delete: `apps/web/components/Waves.js`
- Delete: `apps/web/components/Waves.css`
  Remove obsolete landing-only code after the new landing route is in place.

### Task 1: Create the tested site content registry

**Files:**
- Create: `apps/web/lib/site-content.js`
- Create: `apps/web/lib/site-content.test.js`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  footerLinks,
  getAtAllTimesLinks,
  getLearnPage,
  getSupportPage,
  learnPages,
  shouldShowAtAllTimes,
  supportPages,
} from "./site-content.js";

test("support pages keep the approved footer destinations", () => {
  assert.deepEqual(
    footerLinks.map((link) => link.href),
    ["/about", "/contact", "/faq", "/license"]
  );
  assert.deepEqual(
    footerLinks.map((link) => link.label),
    ["About us", "Contact", "FAQ", "License"]
  );
  assert.equal(supportPages.length, 4);
  assert.equal(getSupportPage("about")?.title, "About us");
});

test("learn pages keep approved slugs and official references", () => {
  assert.deepEqual(
    learnPages.map((page) => page.slug),
    ["xls-65-66", "dex-amm", "boundless", "xls-100"]
  );

  const boundless = getLearnPage("boundless");
  assert.equal(boundless?.title, "Boundless");
  assert.deepEqual(
    boundless?.officialLinks.map((link) => link.href),
    [
      "https://docs.boundless.network/developers/quick-start",
      "https://github.com/boundless-xyz/xrpl-boundless-starter",
    ]
  );
});

test("At All Times is hidden on landing and app routes only", () => {
  assert.equal(shouldShowAtAllTimes("/"), false);
  assert.equal(shouldShowAtAllTimes("/app"), false);
  assert.equal(shouldShowAtAllTimes("/about"), true);
  assert.equal(shouldShowAtAllTimes("/learn/xls-100"), true);
  assert.deepEqual(getAtAllTimesLinks(), [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec node --test lib/site-content.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `./site-content.js`

- [ ] **Step 3: Write the minimal implementation**

```js
export const footerLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/license", label: "License" },
];

export const landingSections = [
  {
    id: "hero",
    eyebrow: "XRPL-native DeFi stack",
    title: "Pyramid",
    lead: "XRPL-native lending, trading, and private execution arranged like an exhibition instead of a dashboard.",
    supporting:
      "Built on the native DEX and AMM, native lending with XLS-65 and XLS-66, and privacy primitives connected to Boundless and XLS-100.",
    artwork: {
      src: "/landing/victoire-de-samothrace-dithered.svg",
      alt: "Victoire de Samothrace artwork",
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
      src: "/landing/pyramide-du-louvre-dithered.svg",
      alt: "Pyramide du Louvre artwork",
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
      src: "/landing/le-scribe-accroupi-dithered.svg",
      alt: "Le Scribe accroupi artwork",
    },
  },
  {
    id: "lending-pools",
    eyebrow: "Lending pools",
    title: "XLS-65 and XLS-66 as the protocol core.",
    body: [
      "This is the densest section on the landing page: vaults, loans, collateral flow, and yield loop.",
      "It should stay airy, but become more diagrammatic than the previous sections.",
    ],
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
];

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
];

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
];

export function getSupportPage(slug) {
  return supportPages.find((page) => page.slug === slug) ?? null;
}

export function getLearnPage(slug) {
  return learnPages.find((page) => page.slug === slug) ?? null;
}

export function shouldShowAtAllTimes(pathname) {
  return pathname !== "/" && pathname !== "/app";
}

export function getAtAllTimesLinks() {
  return [
    { href: "/", label: "Landing Page" },
    { href: "/app", label: "Open App" },
  ];
}
```

- [ ] **Step 4: Add the test script**

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint .",
    "test": "node --test app/api/*.test.js hooks/*.test.js lib/*.test.js"
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test`
Expected: PASS with the existing `app/api`, `hooks`, `lib`, and new `lib/site-content.test.js` suites all green

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/lib/site-content.js apps/web/lib/site-content.test.js
git commit -m "test: add site content registry"
```

### Task 2: Extract the current app into `/app`

**Files:**
- Create: `apps/web/lib/app-shell.js`
- Create: `apps/web/lib/app-shell.test.js`
- Modify: `apps/web/app/layout.js`
- Modify: `apps/web/app/page.js`
- Create: `apps/web/app/app/layout.js`
- Create: `apps/web/app/app/page.js`
- Modify: `apps/web/components/Header.js`
- Create: `apps/web/components/app/AppTabsNav.js`
- Create: `apps/web/components/app/AppPanels.js`
- Create: `apps/web/components/app/AppExperience.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { APP_TABS, DEFAULT_APP_TAB } from "./app-shell.js";

test("app shell keeps the current tab surface and default tab", () => {
  assert.equal(DEFAULT_APP_TAB, "dashboard");
  assert.deepEqual(
    APP_TABS.map((tab) => tab.value),
    ["dashboard", "lending", "loans", "trading"]
  );
  assert.deepEqual(
    APP_TABS.map((tab) => tab.label),
    ["dashboard", "earn yield", "loans", "trading"]
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec node --test lib/app-shell.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `./app-shell.js`

- [ ] **Step 3: Write the minimal app-shell implementation**

```js
export const APP_TABS = [
  { value: "dashboard", label: "dashboard" },
  { value: "lending", label: "earn yield" },
  { value: "loans", label: "loans" },
  { value: "trading", label: "trading" },
];

export const DEFAULT_APP_TAB = APP_TABS[0].value;
```

- [ ] **Step 4: Convert the root layout into a neutral server layout**

```js
import "./globals.css";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata = {
  title: "Pyramid",
  description: "XRPL-native lending, trading, and private execution.",
  icons: {
    icon: [
      { url: "/icon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create the `/app` route wrapper and extracted app experience**

```js
// apps/web/app/app/layout.js
"use client";

import { WalletProvider } from "../../components/providers/WalletProvider";
import PrismBackground from "../../components/three/PrismBackground";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell relative min-h-screen overflow-hidden bg-black text-white">
      <PrismBackground />
      <WalletProvider>
        <div className="relative z-10 min-h-screen">{children}</div>
      </WalletProvider>
    </div>
  );
}
```

```js
// apps/web/app/app/page.js
import { AppExperience } from "../../components/app/AppExperience";

export default function AppPage() {
  return <AppExperience />;
}
```

```js
// apps/web/app/page.js
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#e6ed01] px-6 py-20 text-[#010001] md:px-10">
      <p className="text-[11px] uppercase tracking-[0.18em]">Pyramid</p>
      <h1 className="mt-6 max-w-[9ch] text-5xl leading-[0.92] md:text-7xl">
        Landing rebuild in progress.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8">
        The current XRPL app now lives at <code>/app</code>. The museum-style
        landing page replaces this temporary route in the next task.
      </p>
      <div className="mt-10">
        <Link
          href="/app"
          className="border-b border-current pb-2 text-[12px] uppercase tracking-[0.12em]"
        >
          Open current app
        </Link>
      </div>
    </main>
  );
}
```

```js
// apps/web/components/app/AppTabsNav.js
"use client";

import { motion } from "framer-motion";
import { TabsList, TabsTrigger } from "../ui/tabs";
import { APP_TABS } from "../../lib/app-shell";

export function AppTabsNav({ activeTab, onChange }) {
  return (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-3xl flex justify-between gap-1 md:gap-4 relative mt-2 group">
      <div className="absolute inset-0 bg-[#02040a]/40 border border-white/5 pointer-events-none" />

      {APP_TABS.map(({ value, label }, index) => {
        const isActive = activeTab === value;

        return (
          <TabsTrigger
            key={value}
            value={value}
            onClick={() => onChange(value)}
            className={`relative flex-1 rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white/90 py-4 px-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] transition-colors z-10 group/tab ${isActive ? "text-white" : "text-white/40"}`}
          >
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full">
              <span
                className={`transition-colors duration-500 font-bold ${isActive ? "text-white" : "text-white/10 group-hover/tab:text-white/40"}`}
              >
                [{String(index + 1).padStart(2, "0")}]
              </span>
              <span>{label}</span>
            </div>

            {!isActive && (
              <div className="absolute inset-0 bg-white/[0.01] border border-white/0 group-hover/tab:border-white/10 transition-all duration-300 pointer-events-none z-0 opacity-0 group-hover/tab:opacity-100">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 transition-all duration-300 group-hover/tab:w-2 group-hover/tab:h-2" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 transition-all duration-300 group-hover/tab:w-2 group-hover/tab:h-2" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 transition-all duration-300 group-hover/tab:w-2 group-hover/tab:h-2" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 transition-all duration-300 group-hover/tab:w-2 group-hover/tab:h-2" />
              </div>
            )}

            {isActive && (
              <motion.div
                layoutId="tab-hud-box"
                className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
                <motion.div
                  initial={{ y: "0%" }}
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[1px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"
                />
              </motion.div>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
```

```js
// apps/web/components/app/AppPanels.js
"use client";

import { TabsContent } from "../ui/tabs";
import { AccountInfo } from "../AccountInfo";
import { ActivePositions } from "../ActivePositions";
import { AdvancedTradingForm } from "../AdvancedTradingForm";
import { EarnYieldPage } from "../EarnYieldPage";
import { LendingShowcase } from "../LendingShowcase";
import { LoansPage } from "../LoansPage";
import { ProtocolStats } from "../ProtocolStats";
import { TransactionForm } from "../TransactionForm";
import { ZkPrivacy } from "../ZkPrivacy";

export function AppPanels() {
  return (
    <>
      <TabsContent value="dashboard" className="animate-in fade-in duration-500">
        <div className="mb-6">
          <ProtocolStats />
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 border border-white/20 bg-black/40 backdrop-blur-xl p-0">
            <div className="p-4 border-b border-white/20 bg-white/5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Identity
              </h2>
            </div>
            <AccountInfo />
          </div>
          <div className="lg:col-span-2 border border-white/20 bg-black/40 backdrop-blur-xl relative">
            <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Direct TX
              </h2>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="p-6">
              <TransactionForm />
            </div>
          </div>
        </div>
        <ActivePositions />
      </TabsContent>

      <TabsContent value="lending" className="animate-in fade-in duration-500">
        <EarnYieldPage />
        <LendingShowcase />
      </TabsContent>

      <TabsContent value="loans" className="animate-in fade-in duration-500">
        <LoansPage />
      </TabsContent>

      <TabsContent value="trading" className="animate-in fade-in duration-500">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
            <div className="p-4 border-b border-white/20 bg-white/5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Advanced Trade (Escrow)
              </h2>
            </div>
            <div className="p-4">
              <AdvancedTradingForm />
            </div>
          </div>
          <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col h-full">
            <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Groth5 ZK Prover
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-black px-2 py-1 border border-slate-700">
                RISC0
              </span>
            </div>
            <div className="p-6 flex-1 overflow-y-auto scrollbar-none">
              <ZkPrivacy />
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  );
}
```

```js
// apps/web/components/app/AppExperience.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletManager } from "../../hooks/useWalletManager";

import LEDPyramid from "../three/LEDPyramid";
import { Header } from "../Header";
import { Tabs } from "../ui/tabs";
import { DEFAULT_APP_TAB } from "../../lib/app-shell";
import { AppPanels } from "./AppPanels";
import { AppTabsNav } from "./AppTabsNav";

export function AppExperience() {
  const [activeTab, setActiveTab] = useState(DEFAULT_APP_TAB);
  const router = useRouter();
  useWalletManager();

  const tabsNode = (
    <AppTabsNav activeTab={activeTab} onChange={setActiveTab} />
  );

  return (
    <div className="min-h-screen relative overflow-auto bg-black text-white selection:bg-slate-500/30 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <LEDPyramid />
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

      <div className="relative z-20 flex flex-col min-h-screen">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col pt-20 md:pt-24"
        >
          <Header
            isAppLaunched
            onLaunch={() => {}}
            onGoHome={() => router.push("/")}
            tabsNode={tabsNode}
          />

          <main className="flex-1 w-full z-20 mt-8 px-4 md:px-12 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto pb-12">
              <AppPanels />
            </div>
          </main>
        </Tabs>
      </div>
    </div>
  );
}
```

```js
// apps/web/components/Header.js
"use client";

import Image from "next/image";
import { WalletConnector } from "./WalletConnector";
import { useWallet } from "./providers/WalletProvider";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

export function Header({ isAppLaunched, onLaunch, onGoHome, tabsNode }) {
  const { statusMessage } = useWallet();

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${isAppLaunched ? "bg-black/60 backdrop-blur-md border-b border-white/10" : "bg-transparent mix-blend-difference"}`}>
      {/* existing visual header body remains the same */}
    </header>
  );
}
```

- [ ] **Step 6: Run tests and build**

Run: `pnpm --filter web test`
Expected: PASS including `lib/app-shell.test.js`

Run: `pnpm --filter web build`
Expected: PASS with `/app` generated and the temporary `/` placeholder rendering without `useWallet` provider errors

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/layout.js apps/web/app/page.js apps/web/app/app/layout.js apps/web/app/app/page.js apps/web/components/Header.js apps/web/components/app/AppExperience.js apps/web/components/app/AppPanels.js apps/web/components/app/AppTabsNav.js apps/web/lib/app-shell.js apps/web/lib/app-shell.test.js
git commit -m "refactor: extract current app into app route"
```

### Task 3: Build the shared marketing/content shell

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/app/layout.js`
- Create: `apps/web/components/site/SiteHeader.js`
- Create: `apps/web/components/site/SiteFooter.js`
- Create: `apps/web/components/site/AtAllTimesMenu.js`
- Create: `apps/web/components/site/ContentPageLayout.js`
- Create: `apps/web/components/site/TermLinksRow.js`

- [ ] **Step 1: Write the shared global styles**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
    --museum-bg: #e6ed01;
    --museum-ink: #010001;
    --museum-muted: rgba(1, 0, 1, 0.64);
    --museum-line: rgba(1, 0, 1, 0.16);
  }

  * {
    @apply border-border;
  }

  html,
  body {
    min-height: 100%;
  }

  body {
    @apply bg-background text-foreground;
    min-height: 100vh;
    overflow-x: hidden;
    background: var(--museum-bg);
    color: var(--museum-ink);
    font-family: var(--font-body), sans-serif;
  }

  a {
    color: inherit;
  }

  canvas {
    display: block;
  }
}

@layer utilities {
  .font-display {
    font-family: var(--font-display), serif;
  }

  .font-body {
    font-family: var(--font-body), sans-serif;
  }

  .font-ui {
    font-family: var(--font-mono), monospace;
  }

  .museum-shell {
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 28%),
      radial-gradient(circle at bottom left, rgba(1, 0, 1, 0.05), transparent 24%),
      var(--museum-bg);
    color: var(--museum-ink);
  }

  .museum-rule {
    border-color: var(--museum-line);
  }

  .museum-copy {
    color: var(--museum-muted);
  }

  .app-shell {
    background: #02040a;
    color: white;
  }
}
```

- [ ] **Step 2: Create the shared site chrome components**

```js
// apps/web/components/site/SiteHeader.js
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="font-ui text-[11px] uppercase tracking-[0.18em]"
        >
          Pyramid
        </Link>
        <Link
          href="/app"
          className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.12em]"
        >
          Launch App
        </Link>
      </div>
    </header>
  );
}
```

```js
// apps/web/components/site/SiteFooter.js
import Link from "next/link";

import { footerLinks } from "../../lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t museum-rule mt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
        <p className="max-w-xl text-sm museum-copy">
          Pyramid is an XRPL-native lending, trading, and privacy story built as a
          route-based site instead of a single stateful homepage.
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-ui text-[12px] uppercase tracking-[0.08em] border-b border-current pb-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
```

```js
// apps/web/components/site/AtAllTimesMenu.js
"use client";

import Link from "next/link";
import { useState } from "react";

import { getAtAllTimesLinks } from "../../lib/site-content";

export function AtAllTimesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const links = getAtAllTimesLinks();

  return (
    <div className="fixed left-4 top-4 z-50 md:left-6 md:top-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="border border-current bg-[rgba(255,255,255,0.14)] px-4 py-3 font-ui text-[11px] uppercase tracking-[0.14em] backdrop-blur-sm"
        aria-expanded={isOpen}
        aria-controls="at-all-times-panel"
      >
        At All Times
      </button>

      {isOpen && (
        <div
          id="at-all-times-panel"
          className="mt-2 min-w-[200px] border border-current bg-[#e6ed01] p-3"
        >
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.08em]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

```js
// apps/web/components/site/ContentPageLayout.js
import { AtAllTimesMenu } from "./AtAllTimesMenu";
import { SiteFooter } from "./SiteFooter";

export function ContentPageLayout({
  eyebrow,
  title,
  intro,
  sections,
  officialLinks = [],
  children,
}) {
  return (
    <div className="museum-shell min-h-screen">
      <AtAllTimesMenu />

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
        <p className="font-ui text-[11px] uppercase tracking-[0.18em]">
          {eyebrow}
        </p>
        <h1 className="font-display mt-4 max-w-[10ch] text-5xl leading-[0.92] md:text-7xl">
          {title}
        </h1>
        <p className="museum-copy mt-6 max-w-3xl text-lg leading-8 md:text-xl">
          {intro}
        </p>

        {officialLinks.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {officialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.08em]"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 space-y-14">
          {sections.map((section) => (
            <section key={section.heading} className="border-t museum-rule pt-8">
              <h2 className="font-display text-3xl md:text-5xl">
                {section.heading}
              </h2>
              <div className="museum-copy mt-4 space-y-4 text-lg leading-8">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
```

```js
// apps/web/components/site/TermLinksRow.js
import Link from "next/link";

import { learnPages } from "../../lib/site-content";

export function TermLinksRow() {
  return (
    <div className="flex flex-wrap gap-4">
      {learnPages.map((page) => (
        <Link
          key={page.slug}
          href={page.href}
          className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.08em]"
        >
          {page.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Run build to verify the shell compiles**

Run: `pnpm --filter web build`
Expected: PASS with the new font variables, content-page layout, accessible `At All Times` behavior, shared header/footer shell, and `/app` consuming `.app-shell` as its dark wrapper source of truth

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/globals.css apps/web/app/app/layout.js apps/web/components/site/SiteHeader.js apps/web/components/site/SiteFooter.js apps/web/components/site/AtAllTimesMenu.js apps/web/components/site/ContentPageLayout.js apps/web/components/site/TermLinksRow.js
git commit -m "feat: add marketing shell and shared navigation"
```

### Task 4: Build the new landing page

**Files:**
- Modify: `apps/web/app/page.js`
- Create: `apps/web/components/site/landing/LandingScene.js`
- Create: `apps/web/components/site/landing/LandingHero.js`
- Create: `apps/web/components/site/landing/StorySection.js`
- Create: `apps/web/components/site/landing/LendingSection.js`
- Create: `apps/web/components/site/landing/ClosingSection.js`

- [ ] **Step 1: Write the landing section components**

```js
// apps/web/components/site/landing/LandingHero.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { TermLinksRow } from "../TermLinksRow";

export function LandingHero({ section }) {
  return (
    <section className="grid min-h-[80vh] gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-start">
      <div className="pt-10 md:pt-20">
        <p className="font-ui text-[11px] uppercase tracking-[0.18em]">
          {section.eyebrow}
        </p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display mt-5 max-w-[8ch] text-6xl leading-[0.88] md:text-[8.5rem]"
        >
          {section.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 max-w-2xl text-xl leading-8 md:text-[1.65rem] md:leading-[1.35]"
        >
          {section.lead}
        </motion.p>
        <p className="museum-copy mt-6 max-w-2xl border-t museum-rule pt-5 text-base leading-7 md:text-lg">
          {section.supporting}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/app"
            className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.12em]"
          >
            Launch App
          </Link>
          <span className="font-ui text-[11px] uppercase tracking-[0.14em] museum-copy">
            Scroll into the protocol
          </span>
        </div>

        <div className="mt-10">
          <TermLinksRow />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className="relative flex min-h-[360px] items-center justify-center md:min-h-[78vh]"
      >
        <div className="absolute inset-[10%] rounded-full border museum-rule" />
        <Image
          src={section.artwork.src}
          alt={section.artwork.alt}
          width={720}
          height={960}
          priority
          className="relative z-10 h-auto max-w-[340px] md:max-w-[420px]"
        />
      </motion.div>
    </section>
  );
}
```

```js
// apps/web/components/site/landing/StorySection.js
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function StorySection({ section, reverse = false }) {
  const visualClasses = reverse ? "md:order-2" : "";
  const copyClasses = reverse ? "md:order-1" : "";

  return (
    <section className="grid gap-12 md:grid-cols-2 md:items-start">
      <div className={`${visualClasses} md:sticky md:top-24`}>
        {section.artwork ? (
          <div className="relative flex min-h-[320px] items-center justify-center border-y museum-rule py-12 md:min-h-[500px]">
            <Image
              src={section.artwork.src}
              alt={section.artwork.alt}
              width={960}
              height={960}
              className="h-auto max-w-[360px] md:max-w-[420px]"
            />
          </div>
        ) : null}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7 }}
        className={`${copyClasses} pt-4 md:pt-16`}
      >
        <p className="font-ui text-[11px] uppercase tracking-[0.18em]">
          {section.eyebrow}
        </p>
        <h2 className="font-display mt-4 max-w-[11ch] text-4xl leading-[0.94] md:text-6xl">
          {section.title}
        </h2>
        <div className="museum-copy mt-6 space-y-5 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
```

```js
// apps/web/components/site/landing/LendingSection.js
"use client";

import { motion } from "framer-motion";

export function LendingSection({ section }) {
  const pillars = ["Vaults", "Loans", "Yield"];

  return (
    <section className="grid gap-10 md:grid-cols-[1fr_0.9fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-ui text-[11px] uppercase tracking-[0.18em]">
          {section.eyebrow}
        </p>
        <h2 className="font-display mt-4 max-w-[11ch] text-4xl leading-[0.94] md:text-6xl">
          {section.title}
        </h2>
        <div className="museum-copy mt-6 space-y-5 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 md:pt-14">
        {pillars.map((pillar) => (
          <div key={pillar} className="border-t museum-rule py-6">
            <p className="font-ui text-[11px] uppercase tracking-[0.16em] museum-copy">
              Protocol pillar
            </p>
            <h3 className="font-display mt-2 text-3xl md:text-4xl">{pillar}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
```

```js
// apps/web/components/site/landing/ClosingSection.js
import Link from "next/link";

export function ClosingSection({ section }) {
  return (
    <section className="grid gap-10 border-t museum-rule pt-10 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="font-ui text-[11px] uppercase tracking-[0.18em]">
          {section.eyebrow}
        </p>
        <h2 className="font-display mt-4 max-w-[11ch] text-4xl leading-[0.94] md:text-6xl">
          {section.title}
        </h2>
        <div className="museum-copy mt-6 space-y-5 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="flex items-end md:justify-end">
        <Link
          href="/app"
          className="border-b border-current pb-2 font-ui text-[13px] uppercase tracking-[0.12em]"
        >
          Launch App
        </Link>
      </div>
    </section>
  );
}
```

```js
// apps/web/components/site/landing/LandingScene.js
import { landingSections } from "../../../lib/site-content";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { ClosingSection } from "./ClosingSection";
import { LandingHero } from "./LandingHero";
import { LendingSection } from "./LendingSection";
import { StorySection } from "./StorySection";

export function LandingScene() {
  const [hero, howItWorks, tradingTools, lendingPools, closing] = landingSections;

  return (
    <div className="museum-shell min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-28 px-6 pb-20 md:gap-36 md:px-10">
        <LandingHero section={hero} />
        <StorySection section={howItWorks} />
        <StorySection section={tradingTools} reverse />
        <LendingSection section={lendingPools} />
        <ClosingSection section={closing} />
      </main>

      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: Replace the homepage route**

```js
import { LandingScene } from "../components/site/landing/LandingScene";

export default function HomePage() {
  return <LandingScene />;
}
```

- [ ] **Step 3: Run build to verify the landing route passes**

Run: `pnpm --filter web build`
Expected: PASS with `/` routed to the new landing page and `/app` still available

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.js apps/web/components/site/landing/LandingScene.js apps/web/components/site/landing/LandingHero.js apps/web/components/site/landing/StorySection.js apps/web/components/site/landing/LendingSection.js apps/web/components/site/landing/ClosingSection.js
git commit -m "feat: add museum-style landing page"
```

### Task 5: Add support pages and educational routes

**Files:**
- Create: `apps/web/app/about/page.js`
- Create: `apps/web/app/contact/page.js`
- Create: `apps/web/app/faq/page.js`
- Create: `apps/web/app/license/page.js`
- Create: `apps/web/app/learn/[slug]/page.js`

- [ ] **Step 1: Create the support pages**

```js
// apps/web/app/about/page.js
import { ContentPageLayout } from "../../components/site/ContentPageLayout";
import { getSupportPage } from "../../lib/site-content";

export default function AboutPage() {
  const page = getSupportPage("about");

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    />
  );
}
```

```js
// apps/web/app/contact/page.js
import { ContentPageLayout } from "../../components/site/ContentPageLayout";
import { getSupportPage } from "../../lib/site-content";

export default function ContactPage() {
  const page = getSupportPage("contact");

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <h2 className="font-display text-3xl md:text-5xl">Outbound links</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://github.com/DVB-ESILV/Pyramid" target="_blank" rel="noreferrer" className="border-b border-current pb-2 font-ui text-[12px] uppercase tracking-[0.08em]">
            GitHub
          </a>
        </div>
      </section>
    </ContentPageLayout>
  );
}
```

```js
// apps/web/app/faq/page.js
import { ContentPageLayout } from "../../components/site/ContentPageLayout";
import { getSupportPage } from "../../lib/site-content";

export default function FaqPage() {
  const page = getSupportPage("faq");

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    />
  );
}
```

- [ ] **Step 2: Create the license page and learn route**

```js
// apps/web/app/license/page.js
import path from "node:path";
import { readFile } from "node:fs/promises";

import { ContentPageLayout } from "../../components/site/ContentPageLayout";
import { getSupportPage } from "../../lib/site-content";

async function loadLicenseText() {
  return readFile(path.resolve(process.cwd(), "../../LICENSE"), "utf8");
}

export default async function LicensePage() {
  const page = getSupportPage("license");
  const licenseText = await loadLicenseText();

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <pre className="overflow-x-auto whitespace-pre-wrap bg-[rgba(255,255,255,0.14)] p-6 text-sm leading-7">
          {licenseText}
        </pre>
      </section>
    </ContentPageLayout>
  );
}
```

```js
// apps/web/app/learn/[slug]/page.js
import { notFound } from "next/navigation";

import { ContentPageLayout } from "../../../components/site/ContentPageLayout";
import { getLearnPage, learnPages } from "../../../lib/site-content";

export function generateStaticParams() {
  return learnPages.map((page) => ({ slug: page.slug }));
}

export default function LearnPage({ params }) {
  const page = getLearnPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.summary}
      sections={[
        { heading: "What it is", body: [page.summary] },
        { heading: "Why it matters in Pyramid", body: [page.whyItMatters] },
      ]}
      officialLinks={page.officialLinks}
    />
  );
}
```

- [ ] **Step 3: Run tests and build**

Run: `pnpm --filter web test`
Expected: PASS with `lib/site-content.test.js` still green

Run: `pnpm --filter web build`
Expected: PASS with `/about`, `/contact`, `/faq`, `/license`, and `/learn/[slug]` generated successfully

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/about/page.js apps/web/app/contact/page.js apps/web/app/faq/page.js apps/web/app/license/page.js apps/web/app/learn/[slug]/page.js
git commit -m "feat: add support and educational pages"
```

### Task 6: Remove obsolete landing code and run full verification

**Files:**
- Delete: `apps/web/components/LandingPresentation.js`
- Delete: `apps/web/components/FeatureShowcase.js`
- Delete: `apps/web/components/TechStats.js`
- Delete: `apps/web/components/LiquidChrome.js`
- Delete: `apps/web/components/LiquidChrome.css`
- Delete: `apps/web/components/Waves.js`
- Delete: `apps/web/components/Waves.css`

- [ ] **Step 1: Delete the old landing-only files**

```bash
rm apps/web/components/LandingPresentation.js
rm apps/web/components/FeatureShowcase.js
rm apps/web/components/TechStats.js
rm apps/web/components/LiquidChrome.js
rm apps/web/components/LiquidChrome.css
rm apps/web/components/Waves.js
rm apps/web/components/Waves.css
```

- [ ] **Step 2: Run the full verification suite**

Run: `pnpm --filter web test`
Expected: PASS

Run: `pnpm --filter web lint`
Expected: PASS with no unused imports from the removed landing components

Run: `pnpm --filter web build`
Expected: PASS with `/`, `/app`, support pages, and educational pages all compiling

- [ ] **Step 3: Manual browser verification**

Run: `pnpm --filter web dev`
Expected:
- `/` shows the yellow museum landing page
- the utility strip links open `/learn/xls-65-66`, `/learn/dex-amm`, `/learn/boundless`, and `/learn/xls-100`
- `Launch App` opens `/app`
- `/about`, `/contact`, `/faq`, and `/license` show the `At All Times` control
- `/` and `/app` do not show the `At All Times` control
- official docs links open in a new tab
- mobile layout keeps the landing airy instead of collapsing into dense card stacks

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "refactor: remove obsolete landing components"
```

## Self-Review

### Spec coverage

- Route split for `/` and `/app`: covered by Task 2 and Task 4.
- Museum-editorial palette and typography: covered by Task 3.
- Landing sections with Samothrace, Louvre, and Scribe: covered by Task 4.
- Footer links: covered by Task 1 and Task 3.
- Educational pages and official links: covered by Task 1 and Task 5.
- Boundless starter repo link: covered by Task 1 and Task 5.
- `At All Times` control visibility and destinations: covered by Task 1 and Task 3.
- Asset placement under `apps/web/public/landing/`: already complete on the branch and consumed by Task 4.
- Preservation of the existing app surface: covered by Task 2.

No spec requirement is currently uncovered.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain in the task steps.
- Each code step names exact files and commands.
- Each verification step uses exact commands and expected outcomes.

### Type consistency

- Site metadata module names stay consistent: `footerLinks`, `supportPages`, `learnPages`, `getSupportPage`, `getLearnPage`, `shouldShowAtAllTimes`, `getAtAllTimesLinks`.
- App shell module names stay consistent: `APP_TABS`, `DEFAULT_APP_TAB`.
- `/app` extraction consistently uses `AppExperience`, `AppTabsNav`, and `AppPanels`.
