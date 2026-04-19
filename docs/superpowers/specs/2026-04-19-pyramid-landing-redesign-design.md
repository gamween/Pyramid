# Pyramid Landing Redesign Design

**Date:** 2026-04-19
**Branch Context:** `refactor/landing-page-rebuild`
**Status:** Draft for user review

## Goal

Replace the current stateful landing/app homepage with a route-based, museum-editorial landing experience that:

- presents Pyramid as a full XRPL-native DeFi stack
- hands off cleanly to the existing app
- adds educational and supporting content pages
- establishes a durable visual and navigation foundation for later custom components

This pass lays the structural and stylistic foundation for the new frontend. It does not redesign the internal app experience yet.

## Scope

### Included

- A new landing page at `/` with a hybrid storytelling scroll structure.
- A dedicated app route so `Launch App` opens the current product surface without local state toggling.
- A museum-editorial visual system using:
  - background `#e6ed01`
  - text `#010001`
  - open composition, broad image fields, restrained dividers, and minimal chrome
- Integration of the three provided SVGs into the landing narrative:
  - Samothrace in the hero
  - Louvre in the protocol-composition section
  - Scribe in the trading-tools section
- Footer links for:
  - `About us`
  - `Contact`
  - `FAQ`
  - `License`
- Educational pages for:
  - `XLS-65 / XLS-66`
  - `DEX / AMM`
  - `BOUNDLESS`
  - `XLS-100`
- A persistent top-left `At All Times` control on secondary content pages.
- Logical asset placement for landing artwork under `apps/web/public/landing/`.

### Excluded

- A redesign of the internal `/app` dashboard, forms, tabs, or trading tools.
- Final long-form authored copy for biography, contact details, and FAQ answers beyond the initial structure and tone.
- New protocol functionality.
- Replacement of the existing app backend or app-side architecture.

## Problem Summary

The current homepage combines two separate responsibilities in one route:

1. a landing experience
2. the app itself

This creates four problems:

- the visual tone is too dense and too interface-like for the new museum direction
- navigation is stateful instead of route-based
- supporting content has nowhere to live
- educational protocol terms cannot behave as first-class links

The redesign needs to solve these structurally, not only cosmetically.

## Experience Principles

### 1. Exhibition, not dashboard

The landing page should feel like an exhibition sequence. It must read as an intentional narrative space, not a product admin surface with marketing copy layered on top.

### 2. Headline first, primitives second

Each section should lead with a legible high-level idea, then immediately ground that idea in precise protocol language. The page should feel accessible without becoming vague.

### 3. Open space over boxed UI

The visual system should avoid card grids and tech-panel framing wherever possible. Structure comes from whitespace, alignment, scale, underlines, image placement, and sparse annotation lines.

### 4. Secondary content is first-class

`About us`, `Contact`, `FAQ`, `License`, and the educational protocol pages are part of the site architecture, not popups or afterthoughts.

### 5. Preserve the working app

The new landing page should not block access to the existing app. `Launch App` remains a real handoff to the current app surface during this phase.

## Route Architecture

The homepage should be split into route families instead of using `isAppLaunched`-style local state.

### Primary routes

- `/`
  The new landing page.
- `/app`
  The current application surface extracted from the existing “launched” state.

### Supporting routes

- `/about`
- `/contact`
- `/faq`
- `/license`

### Educational routes

- `/learn/xls-65-66`
- `/learn/dex-amm`
- `/learn/boundless`
- `/learn/xls-100`

### Architectural consequences

- `Launch App` always routes to `/app`.
- The landing page becomes a true document-like experience without app-state branching.
- Secondary pages can share a dedicated content layout and navigation pattern.
- Future component swaps can happen section-by-section without changing the route model again.

## Landing Page Structure

The landing page uses the approved hybrid scroll model: immersive hero first, then story-led sections, then a calmer close.

### 1. Hero / Screen 1

Purpose:
- present Pyramid immediately as the full XRPL-native stack
- establish the museum-editorial tone
- create the strongest first visual with Samothrace

Content direction:
- headline introduces Pyramid as native lending, trading, and private execution
- supporting line references the stack without overloading the headline
- `Launch App` is visible immediately

Visual role:
- Samothrace is the motion anchor
- large serif headline
- wide negative space
- minimal interface framing

### 2. Scroll 1: How It Works

Purpose:
- explain composition of native DEX, AMM, and lending primitives
- prove that the product is assembled from XRPL-native parts

Content direction:
- broad explanatory sentence first
- then exact terms: DEX, AMM, vaults, loans

Visual role:
- Louvre artwork occupies a broad image field
- copy and image sit in tension rather than inside boxes

### 3. Scroll 2: Trading Tools

Purpose:
- explain stop-loss, take-profit, trailing stop, and OCO
- show the added trading surface without reverting to dashboard presentation

Content direction:
- tools are introduced as an editorial sequence
- copy becomes more exact as the user scrolls

Visual role:
- Scribe remains present as a pinned or semi-pinned figure
- tools appear as textual annotations, labels, or reveals rather than card tiles

### 4. Scroll 3: Lending Pools

Purpose:
- make XLS-65 and XLS-66 feel like the protocol core
- become the densest and most explanatory section on the page

Content direction:
- native vaults, loan creation, collateral flow, and yield loop
- this is the most technical section of the landing page

Visual role:
- still open and spacious
- more diagrammatic than the previous sections
- uses lines and alignment only where they clarify the protocol

### 5. Final Block

Purpose:
- connect Boundless and XLS-100 to the story
- introduce the builder and the Hack the Block 2026 context
- land on a clear call to action

Content direction:
- short explanation of private execution
- who built Pyramid and why
- Hack the Block 2026 framing
- final `Launch App`

Visual role:
- less motion
- less spectacle
- more calm and closure

### 6. Footer

The footer should remain light and utility-like, not a large sitemap.

Required links:
- `About us`
- `Contact`
- `FAQ`
- `License`

These links can sit beside or beneath the final block, but they should not visually compete with the closing statement and CTA.

## Visual System

### Palette

- Background: `#e6ed01`
- Text: `#010001`

Derived tones should come from opacity and subtle tints of the same palette, not unrelated accent colors.

### Typography

Recommended type roles:

- Display / headlines: `Cormorant Garamond`
- Body / explanatory copy: `IBM Plex Sans`
- Utility labels / protocol tags / footer links: `IBM Plex Mono`

Rationale:
- the serif gives the page a gallery-title quality
- the sans keeps explanatory copy modern and legible
- the mono voice keeps protocol terms precise without making the whole page look terminal-like

### Layout language

Use:
- large margins
- asymmetry
- broad image fields
- underlines
- hairline dividers
- annotation-style labels

Avoid:
- stacked product cards as the dominant pattern
- glossy control panels
- neon cyber overlays
- interface chrome that makes the page feel like a trading terminal

### Texture and atmosphere

Allowed:
- grain
- paper-like texture
- subtle vignettes or light falloff
- extremely restrained image masking

Not allowed:
- synthetic HUD effects
- glowing scan lines
- heavy glassmorphism
- decorative “futuristic” boxes

## Motion System

Motion should feel architectural and slow.

### Hero

- reveal via masking, fade, and drift
- no aggressive zooming
- no “energy” effects

### Scroll 1

- Louvre remains stable while copy moves
- motion should feel like walking past an installation

### Scroll 2

- Scribe can remain pinned while the copy sequence advances
- tools should appear progressively as annotations

### Scroll 3

- calmer than the hero
- diagram lines or emphasized terms may draw in, but only to clarify the system

### Final block and footer

- nearly static
- CTA underline or simple hover motion is enough

### Accessibility requirement

All motion must degrade cleanly under reduced-motion preferences.

## Secondary Content Family

All non-landing, non-app content routes should use one shared content-page language:

- same palette
- same typography
- same spacing logic
- no app-shell chrome

These pages should feel like part of the same exhibition system, not separate micro-sites.

### About us

Purpose:
- introduce the builder and the project story in more detail

Content direction:
- who you are
- why Pyramid exists
- what was built for Hack the Block 2026

Note:
- the footer label remains `About us`, even if the page reads more like a founder/project page

### Contact

Purpose:
- provide direct ways to reach the builder or project

Content direction:
- email, social, and repository/contact-outlet rows should have dedicated slots in the layout
- the page may launch with only the contact methods currently available, but the route itself is not optional

### FAQ

Purpose:
- answer recurring questions about Pyramid, XRPL-native execution, privacy, and current app status

### License

Purpose:
- present the repository’s license clearly
- link the user to the underlying license source in the repo

## Educational Term Pages

The technical utility items are not dead labels. They are clickable educational entry points.

### Experience rules

Each educational page should include:

- a clear headline
- a plain-language explanation
- a “why it matters in Pyramid” section
- at least one official reference link

These pages should be regular routes, not modals, so they can be linked to directly and revisited.

### Required term pages

#### `/learn/xls-65-66`

Purpose:
- explain native vaults and lending in plain language

Official references:
- XRPL Set Up Lending:
  `https://xrpl.org/docs/tutorials/how-tos/set-up-lending`
- XRPL Single Asset Vaults:
  `https://xrpl.org/docs/concepts/tokens/single-asset-vaults`
- XRPL Create a Loan:
  `https://xrpl.org/docs/tutorials/defi/lending/use-the-lending-protocol/create-a-loan`

#### `/learn/dex-amm`

Purpose:
- explain how XRPL’s DEX and AMM work together

Official references:
- XRPL Decentralized Exchange (DEX):
  `https://xrpl.org/docs/concepts/tokens/decentralized-exchange`
- XRPL Create an Automated Market Maker:
  `https://xrpl.org/docs/tutorials/how-tos/use-tokens/create-an-automated-market-maker/`

#### `/learn/boundless`

Purpose:
- explain Boundless as the proving/execution market used in Pyramid’s privacy story

Official references:
- Boundless Quick Start:
  `https://docs.boundless.network/developers/quick-start`
- XRPL Boundless starter repository:
  `https://github.com/boundless-xyz/xrpl-boundless-starter`

Important note:
- this is official Boundless documentation, not XRP Ledger documentation, and the page should label it as an external dependency clearly

#### `/learn/xls-100`

Purpose:
- explain Smart Escrows and how Pyramid uses them conceptually

Official references:
- XLS-0100 Smart Escrows spec:
  `https://xls.xrpl.org/xls/XLS-0100-smart-escrows.html`
- XRPL Use Escrows:
  `https://xrpl.org/docs/tutorials/how-tos/use-specialized-payment-types/use-escrows/`

### Link behavior

- external reference links should open in a new tab
- the UI should make it clear when the user is leaving Pyramid
- link targets should be treated as content references, not CTA buttons

Reference destinations above were verified against official documentation on 2026-04-19.

## Global `At All Times` Navigation

The user requested a persistent top-left control named `At All Times`.

### Visibility rule

Show `At All Times` on:
- all educational pages
- all supporting content pages

Hide `At All Times` on:
- `/`
- `/app`

### Behavior rule

The control must allow a user to return to either:
- the landing page
- the app

The cleanest design is a compact fixed control that opens on click or tap and reveals two destinations:

- `Landing Page`
- `Open App`

Desktop hover can preview the open state, but click/tap is the required interaction model.

This is preferable to a single context-guessing back button because the user explicitly wants both destinations available.

### Interaction constraints

- fixed top-left position
- visible but not dominant
- large enough touch target on mobile
- keyboard accessible
- must remain legible over all secondary-page content

## Asset Organization

Landing artwork should live under:

- `apps/web/public/landing/le-scribe-accroupi-dithered.svg`
- `apps/web/public/landing/pyramide-du-louvre-dithered.svg`
- `apps/web/public/landing/victoire-de-samothrace-dithered.svg`

This keeps landing assets:
- inside the web app
- routable through stable public URLs
- separate from unrelated root-level project files

## Componentization Direction

The landing rebuild should establish reusable building blocks so later custom components can replace internals without changing the architecture.

Recommended design units:

- a landing shell
- section-level story components
- a shared content-page layout
- a shared footer
- a shared `At All Times` control
- reusable inline term-link components for educational entries

This matches the user’s plan to provide more specific components later.

## Responsive and Accessibility Requirements

### Responsive

- landing sections must preserve openness on mobile without collapsing into dense stacked cards
- hero typography must scale dramatically but remain readable
- educational and supporting pages must work as readable long-form content on narrow screens

### Accessibility

- maintain strong contrast with the chosen palette
- use semantic sections and headings
- give all interactive terms and footer links clear hit targets
- respect reduced-motion preferences
- ensure `At All Times` is keyboard accessible

## Verification Strategy

This redesign needs verification in three layers.

### 1. Structural verification

- `/` renders the new landing page
- `/app` renders the existing app surface
- all supporting pages resolve
- all educational pages resolve

### 2. Interaction verification

- `Launch App` routes to `/app`
- term links open the correct educational pages
- external documentation links open the intended official pages
- `At All Times` is present only on secondary content pages
- `At All Times` reveals both `Landing Page` and `Open App`

### 3. Presentation verification

- desktop and mobile visual QA
- reduced-motion QA
- typography loading QA
- artwork placement QA
- footer readability and balance QA

## Success Criteria

The redesign is successful when:

- the site no longer feels like a dense trading interface at first glance
- Pyramid reads as a coherent full-stack XRPL product from the first screen
- the existing app remains reachable without friction
- supporting and educational pages feel native to the same design system
- technical terms become useful learning paths instead of inert labels
- the project has a durable landing architecture ready for richer components later
