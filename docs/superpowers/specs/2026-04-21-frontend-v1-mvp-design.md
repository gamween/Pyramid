# Pyramid Frontend V1 MVP Design

## Summary

Pyramid V1 is an XRPL-native trading product built on top of XRPL's existing market primitives. XRPL already provides the matching engine, order book, settlement, and native limit orders. Pyramid should not recreate those primitives. The product layer we are building is the trading UX, charting, market structure, advanced-order UX, and the contract-ready architecture for advanced execution.

This design defines the frontend MVP boundary, the contract-ready application structure, the chart/data architecture, and the execution sequencing for the next implementation phase.

## Canonical Product Rules

- Pyramid is not "building a native DEX."
- XRPL already provides:
  - matching engine
  - order book
  - settlement
  - native limit orders
- Pyramid adds:
  - exchange-style frontend UX
  - charting and market visualization
  - order-management UX
  - advanced-order UX
  - contract-ready lifecycle/state modeling
- The active architecture remains:
  - frontend-only
  - direct XRPL reads
  - wallet signing in the browser
  - no watcher
  - no database
  - no centralized backend

## MVP Boundary

### Included in MVP

- Assets
- Markets
- Spot trading terminal
- Orders backoffice
- Native limit place/cancel
- Stop-loss
- Take-profit
- OCO
- Trailing stop
- DCA
- TWAP

### Explicitly excluded from MVP

- XLS-65 / XLS-66 lending
- Boundless / ZKP / privacy execution

### Deleted from active product architecture

- `apps/watcher`
- watcher proxy routes
- watcher-managed order flows
- watcher-managed loan flows
- loan UI tied to server signing

### Truthfulness rule

The frontend must never pretend that local React state is a real execution engine. Any advanced-order surface that appears before contract wiring exists must still be modeled around future on-chain truth.

## Route And UX Architecture

The app should be route-driven and exchange-structured.

### Primary routes

- `/app/assets`
  - wallet/account overview
  - XRP and issued balances
  - trust lines
  - recent ledger activity

- `/app/markets`
  - market discovery
  - searchable list of live markets
  - current market stats
  - links into the terminal

- `/app/trade/spot/[market]`
  - canonical terminal route
  - market identity belongs in the URL
  - chart
  - order book
  - recent trades
  - order entry
  - open orders/history strip
  - advanced-order tools

- `/app/orders`
  - dedicated order/schedule management surface
  - open orders
  - order history
  - trade history
  - advanced-order schedules
  - filters by market, type, side, and status

### Market availability rule

The live app must only show markets that are actually wired to real data and execution.

For the initial MVP:

- show only `XRP / RLUSD`
- do not show inverse mirrors such as `RLUSD / XRP`
- do not show placeholder markets such as `XRP / USDC` or `XRP / EURC` in the live shell

When additional markets are truly wired later, they can be added in their canonical trading direction only.

## Frontend Module Boundaries

### Market data layer

Responsibilities:

- direct XRPL reads
- order book data
- ledger updates
- candle aggregation
- recent trades / market snapshots

### Native trading layer

Responsibilities:

- `OfferCreate`
- `OfferCancel`
- wallet signing
- confirmation and reconciliation handling

### Advanced-order layer

Responsibilities:

- advanced-order intent creation
- lifecycle/status display
- cancellation/status model
- future contract integration boundary

This layer must be designed now as if the contract already exists, so the data source can be replaced later without redesigning the terminal.

### Presentation layer

Responsibilities:

- chart rendering
- order book rendering
- trade panel
- order/schedule tables
- exchange-style UX consistent with the established Pyramid art direction

## Trading Behavior And Lifecycle Model

### Native limit order

Uses XRPL native `OfferCreate` and `OfferCancel`.

Lifecycle:

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `open`
- `partially filled`
- `filled`
- `cancelled`
- `failed`

### Stop-loss

Persistent advanced-order record with trigger metadata.

Lifecycle:

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `active`
- `triggered`
- `executing`
- terminal state

### Take-profit

Same lifecycle model as stop-loss, with take-profit trigger semantics.

### OCO

One parent advanced-order record with two linked legs.

Lifecycle:

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `active`
- one leg `triggered`
- other leg `cancelled`
- terminal state

### Trailing stop

Real advanced-order type with tracked reference state.

Lifecycle:

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `active`
- `tracking`
- `triggered`
- `executing`
- terminal state

### DCA

Schedule, not a regular order.

Lifecycle:

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `active`
- repeated slice execution
- `completed` or `cancelled` or `failed`

### TWAP

Schedule with total amount distributed across slices and time buckets.

Lifecycle mirrors DCA.

### Canonical statuses

- `draft`
- `awaiting signature`
- `submitted`
- `pending confirmation`
- `active`
- `tracking`
- `triggered`
- `executing`
- `open`
- `partially filled`
- `filled`
- `completed`
- `cancelled`
- `failed`
- `expired`

## Chart And Market Data Architecture

### Core charting rule

Do not rebuild TradingView. Use TradingView Lightweight Charts for rendering only.

### Layers

#### Rendering layer

- `TradingChart`
- receives already-aggregated OHLC candles
- does not contain XRPL transport logic

#### Market data hook

- `useXRPLMarketData({ market, timeframe })`
- fetches initial market history
- keeps live order book fresh
- tracks recent trades
- exposes chart-ready candles
- exposes live market metadata

#### Aggregation layer

Pure utilities:

- normalize XRPL market events
- bucket timestamps by timeframe
- build OHLC candles
- update the current candle on new activity

### Chart data flow

1. terminal route resolves `market` and `timeframe`
2. market-data hook fetches XRPL data
3. raw events are normalized
4. aggregation utilities produce:
   - `time`
   - `open`
   - `high`
   - `low`
   - `close`
5. chart receives candle data
6. live updates refresh:
   - order book
   - recent trades
   - current or next candle

### Timeframe support

Support:

- `1m`
- `5m`
- `15m`
- `1h`
- `4h`
- `1D`

Use one shared bucketing path, not separate logic per timeframe.

### Frontend-only constraint handling

- candles are computed in the browser
- live updates use incremental `series.update(...)`
- partial hydration is acceptable
- if chart history is incomplete, the terminal still shows book/trade data honestly

## Visual Direction For The App Shell

The app should keep the exchange-product structure while staying inside the Pyramid visual system.

Required qualities:

- consistent with landing-page art direction
- editorial spacing
- museum yellow / ink palette
- not a generic cloned Binance skin
- exchange-like density where needed
- clarity over decorative excess

The chart/terminal reference is structurally useful, but the finished interface should still feel like Pyramid.

## Execution Plan Structure

### Phase 0 — Architecture cut

- delete `apps/watcher`
- delete watcher proxy routes
- delete watcher tests and watcher-only normalizers
- remove loan/watcher UI from the active app
- align docs to one architecture

### Phase 1 — Contract-ready frontend shell

- finalize route structure
- make shell responsive and visually coherent
- expose all advanced-order surfaces with the correct future-proof data model

### Phase 2 — Real market-data layer

- replace temporary price trace with real candlestick aggregation
- wire XRPL reads for candles, order book, recent trades, and market stats
- add timeframe support

### Phase 3 — Native spot execution

- harden limit place/cancel
- improve confirmation/reconciliation
- make `/app/orders` a true management surface

### Phase 4 — Advanced-order engine contract foundation

- define the frontend-facing contract model for:
  - stop-loss
  - take-profit
  - OCO
  - trailing stop
  - DCA
  - TWAP
- implement the frontend state machine and integration boundaries as if the contract already exists
- create the repo structure for contract code

### Phase 5 — Integration and MVP hardening

- connect frontend flows to the real on-chain engine
- add reliable status mapping and cancellation flows
- handle devnet resets, wallet failures, reconnects, and empty states
- harden the demo flow

## Documentation / Unknowns Rule

Do not assume missing blockchain or contract details.

When contract-side ambiguity appears, implementation must stop and request the exact documentation, interface, or constraint instead of inventing behavior.
