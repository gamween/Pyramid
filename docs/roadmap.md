# Pyramid Roadmap

## Product Roadmap Principle

Pyramid should not try to ship every idea at once. The roadmap is intentionally phased so the product can become a credible XRPL-native trading interface before expanding into broader protocol surfaces.

## Current Direction

- target environment: XRPL devnet
- architecture: frontend-only, on-chain-first
- deployment: Vercel for the frontend
- persistence target: on-chain logic and smart contracts
- excluded from active V1: watcher bot, centralized backend, database

## Phase 1: Frontend V1 Foundation

Goal: establish the product shell and route structure for a real exchange-style experience.

Includes:

- `/app/assets`
- `/app/markets`
- `/app/trade/spot`
- `/app/orders`
- consistent app chrome and navigation
- honest placeholders for not-yet-implemented modules
- removal of watcher-era assumptions from the active user experience

## Phase 2: Trading V1

Goal: deliver a focused XRPL-native spot trading experience.

V1 scope:

- chart
- order book
- place / cancel
- stop-loss
- take-profit
- OCO

This is the implementation priority for the product.

## Phase 3: Trading Expansion

Goal: deepen the trading toolset without changing the architectural stance.

Candidates:

- trailing stop
- richer market analytics
- stronger order-management workflows
- direct-read devnet hardening and polish

## Phase 4: Lending

Goal: reintroduce vault / lending flows only when they fit the active on-chain-first system cleanly.

Candidates:

- vault surfaces
- lending overview
- borrowing and collateral management

These belong after the trading V1 product is stable.

## Phase 5: Privacy

Goal: integrate privacy-oriented flows only when they can be represented honestly inside the same architecture.

Candidates:

- private execution surfaces
- privacy-oriented trade flows
- supporting educational and status messaging

## What Is Explicitly Not In Active V1

- backend watcher orchestration
- database-managed order state
- fake off-chain persistence disguised as product logic
- building every roadmap item at once

## Delivery Rule

Each phase should leave the app in a truthful state:

- implemented features behave like real product surfaces
- future areas can be visible as placeholders
- placeholders must be labeled clearly
- docs and UI copy must always reflect the active architecture rather than the legacy hackathon stack
