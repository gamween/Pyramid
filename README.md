# Pyramid

Pyramid is an XRPL-native trading product being built on top of the XRP Ledger's existing market primitives, not a claim to "create a native DEX." XRPL already provides native exchange rails. The product opportunity is to build a strong trading interface, execution layer, and order workflow on top of those rails.

The current direction is deliberately narrow:

- target network: XRPL devnet
- active architecture: frontend-only, deployed on Vercel
- wallet signing in the browser
- direct network reads from the frontend
- persistence and automation logic intended to live on-chain through XRPL-native primitives
- no database
- no centralized backend
- no watcher bot
- no server-managed loan signing

## Product Direction

Pyramid is being re-centered as a trading product first.

The core experience is organized around four areas:

1. Assets
2. Markets
3. Trade -> Spot
4. Orders

The active repo is trading-only. Watcher, loan, and proxy architecture have been removed from the current V1 direction.

## V1 Scope

V1 is intentionally focused on the trading terminal and order workflow:

- chart
- order book
- place / cancel
- stop-loss
- take-profit
- OCO

The frontend may already expose placeholders for later capabilities so the full product vision is visible, but the active implementation priority is V1 trading.

## Later Phases

Later phases expand the product surface without changing the architectural stance:

- trailing stop
- privacy

Those features should only move forward when they can fit the same on-chain-first model without introducing centralized backend assumptions.

## Active Architecture

```text
Wallet (browser)
   |
   | sign + read
   v
Next.js frontend on Vercel
   |
   | direct XRPL reads via xrpl.js
   | direct wallet signing
   v
XRPL devnet + smart contract environment
```

Canonical architectural rules:

- no watcher-managed UX in the active app
- no hidden backend dependency for order state
- no database-backed source of truth
- if behavior must persist, it belongs on-chain
- if a future feature is not implemented yet, expose it as a placeholder instead of faking off-chain logic

## App Information Architecture

The app shell is being rebuilt around explicit exchange-style routes:

- `/app/assets`
- `/app/markets`
- `/app/trade/spot`
- `/app/orders`

`/app` should act as an entrypoint into that shell rather than a separate legacy dashboard.

## Design Direction

The landing page already established the Pyramid visual system:

- museum-like spacing
- yellow field (`#e6ed01`)
- near-black ink (`#010001`)
- editorial typography
- minimal framing instead of generic dashboard cards

The app should feel inspired by exchange products such as Binance or Bybit in structure and usability, while still remaining consistent with Pyramid's brand and landing-page language.

## Repository Structure

```text
Pyramid/
├── apps/
│   └── web/          # Active Next.js frontend
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   └── xrpl-reference.md
├── packages/
└── README.md
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [XRPL Reference](./docs/xrpl-reference.md)

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- pnpm >= 8

### Install

```bash
git clone https://github.com/gamween/Pyramid.git
cd Pyramid
pnpm install
```

### Run the frontend

```bash
pnpm --filter web dev
```

The app runs at `http://localhost:3000`.

## Current Goal

The current repo focus is to deliver a clean frontend V1 foundation for XRPL-native spot trading on devnet:

- clear exchange-style navigation
- dedicated assets, markets, trade, and orders pages
- direct-read architecture
- placeholders for later phases without pretending they are implemented today
