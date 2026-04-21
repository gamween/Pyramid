# Pyramid Architecture

## Canonical Product Framing

Pyramid is an XRPL-native trading product. It is not positioned as "building the first native DEX on XRPL" because XRPL already provides native exchange primitives. The active problem is productization: build a trading experience that makes XRPL-native markets usable, legible, and extensible.

The current implementation target is XRPL devnet with the smart contract environment needed for the on-chain roadmap.

## Active System Model

The canonical architecture for the current product direction is:

```text
browser wallet
  -> Next.js frontend
  -> direct XRPL devnet reads
  -> on-chain persistence / smart contract logic
```

### Active assumptions

- frontend deployed on Vercel
- wallet signing from the browser
- direct network reads from the frontend
- no database
- no off-chain backend
- no watcher bot in the active V1 product architecture
- any state that must persist belongs on-chain

### Consequences

- UI must not depend on a centralized service to remain truthful
- features that are not yet on-chain-ready should be placeholders, not fake backend flows
- the app shell should communicate what is live, what is scaffolded, and what is future

## Legacy Inventory

This repo still contains hackathon-era watcher and proxy code:

- `apps/watcher`
- watcher proxy API routes in `apps/web/app/api`
- components and flows built around watcher-managed execution

These are legacy artifacts. They remain in the repo as historical reference, but they are no longer the active V1 architecture and should not drive the current frontend UX or product messaging.

## Frontend Information Architecture

The app should be organized as a real exchange-style shell, not a single tabbed demo surface.

### Primary routes

- `/app`
  Entry point into the application shell. It should resolve into the new exchange product experience rather than a separate hackathon dashboard.

- `/app/assets`
  Account overview, balances, allocations, and account history.

- `/app/markets`
  Market discovery: pairs, search, 24h stats, movers, trending sections, and XRPL-context market surfaces.

- `/app/trade/spot`
  Spot trading terminal: chart, order book, recent trades, order entry, and order workflow modules.

- `/app/orders`
  Dedicated order management page: open orders, order history, trade history, and filters.

### Support and educational routes

Existing landing/support/learn routes remain valid and sit outside the app shell:

- `/`
- `/about`
- `/contact`
- `/faq`
- `/license`
- `/privacy-policy`
- `/terms-of-service`
- `/learn/[slug]`

## Product Modules

### Shared app shell

Responsibilities:

- top navigation across Assets / Markets / Trade / Orders
- wallet status area
- network badge for devnet
- consistent page chrome and spacing
- mobile-responsive navigation

### Assets module

Responsibilities:

- balances overview
- portfolio allocation summary
- asset table
- account history

Implementation stance:

- direct frontend reads only
- no fake PnL engine
- placeholder language where live XRPL aggregation is not yet implemented

### Markets module

Responsibilities:

- searchable pair list
- headline market metrics
- movers / trending sections
- XRPL-adapted market categories

Implementation stance:

- direct market reads
- no centralized market cache assumed
- placeholder panels are acceptable if they are labeled honestly

### Trade / Spot module

Responsibilities:

- candlestick chart
- order book
- recent trades
- order entry
- advanced order controls
- open orders / trade history strip

V1 live focus:

- place / cancel
- stop-loss
- take-profit
- OCO

Future placeholders visible in the terminal:

- trailing stop
- lending
- privacy

### Orders module

Responsibilities:

- open orders
- order history
- trade history
- filters by pair / type / status
- exchange-style data table ergonomics

This page is important enough to stand alone rather than being buried inside the trade terminal.

## Implementation Boundaries

To keep the product scalable, the frontend foundation should separate:

1. app shell and navigation
2. page-level composition
3. market data presentation
4. order-entry interfaces
5. history / table components
6. placeholder / future-state messaging

The point is to make it possible to replace placeholder sections with real direct XRPL integrations later without rewriting the entire shell.

## V1 vs Placeholder vs Later

### V1 implementation priority

- assets page shell
- markets page shell
- spot trading terminal shell
- orders page shell
- clean navigation and layout
- explicit V1 order tool focus: place / cancel / stop-loss / take-profit / OCO

### Placeholder, but visible now

- trailing stop panels
- lending modules
- privacy modules
- any direct-read section not yet wired to live XRPL data

### Later phases

- full trailing stop logic
- vault and lending product flows
- privacy flows

## Design Constraints

The app should borrow structural lessons from Binance and Bybit:

- information density
- dedicated markets page
- dedicated orders page
- terminal-oriented trade layout

But it should still remain a Pyramid product:

- same yellow / ink palette language where appropriate
- same editorial typography system
- same preference for clean composition over noisy crypto-dashboard clutter
- no generic copy-paste exchange skin that ignores the landing page's brand system

## Documentation Rule

When docs or UI text describe the active architecture, they must describe the front-only, on-chain-first direction. Legacy watcher code can be mentioned, but only as deprecated historical context.
