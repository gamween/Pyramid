# Pyramid Frontend V1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the watcher/loan architecture, lock Pyramid to one live XRPL spot market (`XRP / RLUSD`), and ship a contract-ready trading frontend with real chart, order book, native limit execution, and clean order-management UX.

**Architecture:** This plan intentionally covers the frontend-side MVP cut first: remove dead watcher/server flows, finish the route-driven exchange shell, wire real XRPL market data, and harden native spot trading. It also introduces the advanced-order domain model and contract-facing UI boundaries, but it does **not** invent the actual on-chain executor internals; that subsystem needs a dedicated follow-up plan once the target smart-contract environment docs are available.

**Tech Stack:** Next.js App Router, React 19, xrpl.js (`xrpl@4.5.0-smartescrow.4`), xrpl-connect, TradingView Lightweight Charts, Node test runner, ESLint

---

## File Structure

### Delete

- `apps/watcher/**`
- `apps/web/app/api/dca/route.js`
- `apps/web/app/api/orders/route.js`
- `apps/web/app/api/orders/[owner]/[sequence]/route.js`
- `apps/web/app/api/loans/**`
- `apps/web/app/api/watcher-url.js`
- `apps/web/app/api/watcher-proxy-write-routes.test.js`
- `apps/web/components/ActivePositions.js`
- `apps/web/components/AdvancedTradingForm.js`
- `apps/web/components/EarnYieldPage.js`
- `apps/web/components/LendingShowcase.js`
- `apps/web/components/LoansPage.js`
- `apps/web/components/ZkPrivacy.js`
- `apps/web/components/loans/**`
- `apps/web/hooks/useEscrow.js`
- `apps/web/hooks/useEscrow.validation.js`
- `apps/web/hooks/useEscrow.validation.test.js`
- `apps/web/hooks/useLoanMarket.js`
- `apps/web/hooks/usePrice.js`
- `apps/web/hooks/useVault.js`
- `apps/web/lib/order-state.js`
- `apps/web/lib/order-state.test.js`

### Create

- `apps/web/app/app/trade/spot/[market]/page.js`
- `apps/web/lib/no-watcher-left.test.js`
- `apps/web/lib/market-registry.test.js`
- `apps/web/scripts/capture-xrpl-market-data.mjs`
- `apps/web/lib/fixtures/xrp-rlusd.book-changes.json`
- `apps/web/lib/fixtures/xrp-rlusd.book-offers.json`
- `apps/web/lib/market-data/timeframes.js`
- `apps/web/lib/market-data/timeframes.test.js`
- `apps/web/lib/market-data/candle-aggregation.js`
- `apps/web/lib/market-data/candle-aggregation.test.js`
- `apps/web/lib/market-data/xrpl-market-feed.js`
- `apps/web/hooks/useXRPLMarketData.js`
- `apps/web/components/app/TradingChart.js`
- `apps/web/lib/trade-terminal.test.js`
- `apps/web/lib/order-lifecycle.js`
- `apps/web/lib/order-lifecycle.test.js`
- `apps/web/lib/advanced-orders/statuses.js`
- `apps/web/lib/advanced-orders/drafts.js`
- `apps/web/lib/advanced-orders.test.js`
- `packages/advanced-orders/README.md`

### Modify

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `apps/web/app/api/README.md`
- `apps/web/app/app/page.js`
- `apps/web/app/app/layout.js`
- `apps/web/app/app/markets/page.js`
- `apps/web/app/app/orders/page.js`
- `apps/web/app/app/trade/spot/page.js`
- `apps/web/app/globals.css`
- `apps/web/components/app/AppShellLayout.js`
- `apps/web/components/app/AssetsWorkspace.js`
- `apps/web/components/app/MarketsWorkspace.js`
- `apps/web/components/app/OrdersWorkspace.js`
- `apps/web/components/app/TradeSpotWorkspace.js`
- `apps/web/hooks/useSpotMarket.js`
- `apps/web/hooks/useSpotOrders.js`
- `apps/web/lib/app-routes.test.js`
- `apps/web/lib/app-shell.js`
- `apps/web/lib/app-shell.test.js`
- `apps/web/lib/constants.js`
- `apps/web/lib/market-registry.js`
- `apps/web/lib/spot-order.js`
- `apps/web/lib/spot-order.test.js`
- `apps/web/lib/xrplClient.js`
- `apps/web/package.json`
- `pnpm-lock.yaml`

---

### Task 1: Delete Watcher / Loan Architecture And Prove It Is Gone

**Files:**
- Create: `apps/web/lib/no-watcher-left.test.js`
- Modify: `apps/web/lib/constants.js`, `README.md`, `docs/architecture.md`, `docs/roadmap.md`, `apps/web/app/api/README.md`
- Delete: `apps/watcher/**`, `apps/web/app/api/dca/route.js`, `apps/web/app/api/orders/**`, `apps/web/app/api/loans/**`, `apps/web/app/api/watcher-url.js`, `apps/web/app/api/watcher-proxy-write-routes.test.js`, `apps/web/components/ActivePositions.js`, `apps/web/components/AdvancedTradingForm.js`, `apps/web/components/EarnYieldPage.js`, `apps/web/components/LendingShowcase.js`, `apps/web/components/LoansPage.js`, `apps/web/components/ZkPrivacy.js`, `apps/web/components/loans/**`, `apps/web/hooks/useEscrow.js`, `apps/web/hooks/useEscrow.validation.js`, `apps/web/hooks/useEscrow.validation.test.js`, `apps/web/hooks/useLoanMarket.js`, `apps/web/hooks/usePrice.js`, `apps/web/hooks/useVault.js`, `apps/web/lib/order-state.js`, `apps/web/lib/order-state.test.js`
- Test: `apps/web/lib/no-watcher-left.test.js`

- [ ] **Step 1: Write the failing deletion test**

```js
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"

const forbiddenPaths = [
  "../../watcher",
  "../app/api/dca/route.js",
  "../app/api/orders/route.js",
  "../app/api/orders/[owner]/[sequence]/route.js",
  "../app/api/loans",
  "../app/api/watcher-url.js",
  "../components/AdvancedTradingForm.js",
  "../components/ActivePositions.js",
  "../components/LoansPage.js",
  "../hooks/useLoanMarket.js",
  "./order-state.js",
]

test("watcher-era backend and loan files are removed from the active repo", () => {
  for (const relativePath of forbiddenPaths) {
    assert.equal(existsSync(new URL(relativePath, import.meta.url)), false, relativePath)
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test lib/no-watcher-left.test.js`

Expected: FAIL because the watcher, proxy routes, and loan/watcher files still exist.

- [ ] **Step 3: Delete the watcher and watcher-tied frontend files**

Run:

```bash
rm -rf apps/watcher
rm -rf apps/web/app/api/loans
rm -rf apps/web/app/api/orders
rm -f apps/web/app/api/dca/route.js apps/web/app/api/watcher-url.js apps/web/app/api/watcher-proxy-write-routes.test.js
rm -rf apps/web/components/loans
rm -f apps/web/components/ActivePositions.js apps/web/components/AdvancedTradingForm.js apps/web/components/EarnYieldPage.js apps/web/components/LendingShowcase.js apps/web/components/LoansPage.js apps/web/components/ZkPrivacy.js
rm -f apps/web/hooks/useEscrow.js apps/web/hooks/useEscrow.validation.js apps/web/hooks/useEscrow.validation.test.js apps/web/hooks/useLoanMarket.js apps/web/hooks/usePrice.js apps/web/hooks/useVault.js
rm -f apps/web/lib/order-state.js apps/web/lib/order-state.test.js
```

Then slim `apps/web/lib/constants.js` to the trading-only surface:

```js
export const ORDER_TYPES = {
  STOP_LOSS: "STOP_LOSS",
  TAKE_PROFIT: "TAKE_PROFIT",
  TRAILING_STOP: "TRAILING_STOP",
  OCO: "OCO",
  DCA: "DCA",
  TWAP: "TWAP",
}

export const SIDES = { BUY: "BUY", SELL: "SELL" }

export const ADDRESSES = {
  RLUSD_ISSUER: "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs",
}
```

- [ ] **Step 4: Update docs to stop calling watcher code “legacy retained”**

Use wording like this in the docs:

```md
- no watcher
- no centralized backend
- no database
- no server-managed loan signing
```

Run:

```bash
rg -n "watcher|loan" README.md docs/architecture.md docs/roadmap.md apps/web/app/api/README.md
pnpm --filter web exec node --test lib/no-watcher-left.test.js
```

Expected: the search only finds intentional historical/documentation mentions you kept; the test passes.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/architecture.md docs/roadmap.md apps/web/app/api/README.md apps/web/lib/constants.js apps/web/lib/no-watcher-left.test.js
git add -u apps/watcher apps/web/app/api apps/web/components apps/web/hooks apps/web/lib
git commit -m "refactor: remove watcher and loan architecture"
```

---

### Task 2: Lock The App To One Live Market And A Market-Scoped Terminal Route

**Files:**
- Create: `apps/web/app/app/trade/spot/[market]/page.js`, `apps/web/lib/market-registry.test.js`
- Modify: `apps/web/app/app/trade/spot/page.js`, `apps/web/lib/market-registry.js`, `apps/web/lib/app-shell.js`, `apps/web/lib/app-shell.test.js`, `apps/web/lib/app-routes.test.js`, `apps/web/components/app/MarketsWorkspace.js`, `apps/web/components/app/TradeSpotWorkspace.js`, `apps/web/components/app/AppShellLayout.js`
- Test: `apps/web/lib/market-registry.test.js`, `apps/web/lib/app-shell.test.js`, `apps/web/lib/app-routes.test.js`

- [ ] **Step 1: Write the failing market-scope tests**

`apps/web/lib/market-registry.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"

import { ACTIVE_SPOT_MARKET, LIVE_MARKETS, getMarketBySlug } from "./market-registry.js"

test("the live market registry only exposes XRP / RLUSD", () => {
  assert.equal(LIVE_MARKETS.length, 1)
  assert.equal(ACTIVE_SPOT_MARKET.symbol, "XRP / RLUSD")
  assert.equal(ACTIVE_SPOT_MARKET.slug, "xrp-rlusd")
  assert.equal(getMarketBySlug("xrp-rlusd")?.symbol, "XRP / RLUSD")
})
```

Update `apps/web/lib/app-shell.test.js` to expect:

```js
assert.equal(LIVE_TRADE_ROUTE.href, "/app/trade/spot/xrp-rlusd")
```

Update `apps/web/lib/app-routes.test.js` to expect:

```js
assert.equal(existsSync(new URL("../app/app/trade/spot/[market]/page.js", import.meta.url)), true)
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
pnpm --filter web exec node --test lib/market-registry.test.js lib/app-shell.test.js lib/app-routes.test.js
```

Expected: FAIL because the registry still includes extra unwired and inverse markets, and the dynamic route does not exist yet.

- [ ] **Step 3: Implement the single-market registry and market-scoped route**

Use a registry shaped like this in `apps/web/lib/market-registry.js`:

```js
import { ADDRESSES } from "./constants.js"

export const ACTIVE_SPOT_MARKET = {
  id: "xrp-rlusd",
  slug: "xrp-rlusd",
  symbol: "XRP / RLUSD",
  shortLabel: "XRP/RLUSD",
  baseCode: "XRP",
  quoteCode: "RLUSD",
  quoteCurrency: "USD",
  quoteIssuer: ADDRESSES.RLUSD_ISSUER,
  stage: "live",
}

export const LIVE_MARKETS = [ACTIVE_SPOT_MARKET]

export function getMarketBySlug(slug) {
  return LIVE_MARKETS.find((market) => market.slug === slug) ?? null
}
```

Set the trade nav target in `apps/web/lib/app-shell.js`:

```js
export const LIVE_TRADE_ROUTE = {
  href: `/app/trade/spot/${ACTIVE_SPOT_MARKET.slug}`,
  label: "Spot",
  stage: "live",
}
```

Add the new route page:

```js
import { notFound } from "next/navigation"

import { TradeSpotWorkspace } from "../../../../../components/app/TradeSpotWorkspace"
import { getMarketBySlug, LIVE_MARKETS } from "../../../../../lib/market-registry"

export function generateStaticParams() {
  return LIVE_MARKETS.map((market) => ({ market: market.slug }))
}

export default async function SpotMarketPage({ params }) {
  const resolvedParams = await params
  const market = getMarketBySlug(resolvedParams.market)
  if (!market) notFound()
  return <TradeSpotWorkspace market={market} />
}
```

Keep `apps/web/app/app/trade/spot/page.js` only as a redirect:

```js
import { redirect } from "next/navigation"

export default function SpotRedirectPage() {
  redirect("/app/trade/spot/xrp-rlusd")
}
```

- [ ] **Step 4: Remove unwired markets from the UI**

In `apps/web/components/app/MarketsWorkspace.js`, render only `LIVE_MARKETS` and make the row link to the market-scoped terminal route:

```jsx
<Link href={`/app/trade/spot/${entry.slug}`} className="block">
  <span className="font-semibold">{entry.symbol}</span>
</Link>
```

In `apps/web/components/app/TradeSpotWorkspace.js`, accept a `market` prop instead of importing a fixed active market internally.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter web exec node --test lib/market-registry.test.js lib/app-shell.test.js lib/app-routes.test.js
git add apps/web/app/app/trade/spot/page.js apps/web/app/app/trade/spot/[market]/page.js apps/web/lib/market-registry.js apps/web/lib/market-registry.test.js apps/web/lib/app-shell.js apps/web/lib/app-shell.test.js apps/web/lib/app-routes.test.js apps/web/components/app/MarketsWorkspace.js apps/web/components/app/TradeSpotWorkspace.js
git commit -m "feat: scope the app to one live market"
```

---

### Task 3: Add Lightweight Charts And Build Testable Candle Aggregation Utilities

**Files:**
- Modify: `apps/web/package.json`, `pnpm-lock.yaml`
- Create: `apps/web/scripts/capture-xrpl-market-data.mjs`, `apps/web/lib/fixtures/xrp-rlusd.book-changes.json`, `apps/web/lib/fixtures/xrp-rlusd.book-offers.json`, `apps/web/lib/market-data/timeframes.js`, `apps/web/lib/market-data/timeframes.test.js`, `apps/web/lib/market-data/candle-aggregation.js`, `apps/web/lib/market-data/candle-aggregation.test.js`
- Test: `apps/web/lib/market-data/timeframes.test.js`, `apps/web/lib/market-data/candle-aggregation.test.js`

- [ ] **Step 1: Install Lightweight Charts**

Run:

```bash
pnpm --filter web add lightweight-charts
```

Expected: `apps/web/package.json` gains `"lightweight-charts"` and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Add a capture script so you do not guess XRPL payload shapes**

Create `apps/web/scripts/capture-xrpl-market-data.mjs`:

```js
import { writeFile } from "node:fs/promises"
import { Client } from "xrpl"

const client = new Client("wss://wasm.devnet.rippletest.net:51233")

async function main() {
  await client.connect()

  const ledger = await client.request({ command: "ledger", ledger_index: "validated" })
  const ledgerIndex = ledger.result.ledger_index

  const bookChanges = await client.request({
    command: "book_changes",
    ledger_index: ledgerIndex,
  })

  const bookOffers = await client.request({
    command: "book_offers",
    taker_pays: {
      currency: "USD",
      issuer: "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs",
    },
    taker_gets: { currency: "XRP" },
    limit: 20,
  })

  await writeFile(
    new URL("../lib/fixtures/xrp-rlusd.book-changes.json", import.meta.url),
    JSON.stringify(bookChanges.result, null, 2)
  )

  await writeFile(
    new URL("../lib/fixtures/xrp-rlusd.book-offers.json", import.meta.url),
    JSON.stringify(bookOffers.result, null, 2)
  )

  await client.disconnect()
}

void main()
```

- [ ] **Step 3: Run the capture script and commit the first fixture snapshots**

Run:

```bash
node apps/web/scripts/capture-xrpl-market-data.mjs
```

Expected: the two JSON fixture files appear under `apps/web/lib/fixtures/`.

- [ ] **Step 4: Write failing tests for timeframe bucketing and OHLC aggregation**

`apps/web/lib/market-data/timeframes.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"

import { bucketTimestamp } from "./timeframes.js"

test("bucketTimestamp rounds down to the start of the selected interval", () => {
  assert.equal(bucketTimestamp(1713703325000, "1m"), 1713703320000)
  assert.equal(bucketTimestamp(1713703325000, "5m"), 1713703200000)
  assert.equal(bucketTimestamp(1713703325000, "1h"), 1713700800000)
})
```

`apps/web/lib/market-data/candle-aggregation.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"
import fixture from "../fixtures/xrp-rlusd.book-changes.json" with { type: "json" }

import { extractMarketLedgerChange, aggregateLedgerChangesToCandles } from "./candle-aggregation.js"

test("extractMarketLedgerChange selects the XRP / RLUSD ledger change", () => {
  const change = extractMarketLedgerChange(fixture, "XRP_drops", "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD")
  assert.ok(change)
})

test("aggregateLedgerChangesToCandles returns OHLC rows", () => {
  const candles = aggregateLedgerChangesToCandles([fixture], "1m")
  assert.equal(Array.isArray(candles), true)
  assert.ok(candles.every((row) => "time" in row && "open" in row && "high" in row && "low" in row && "close" in row))
})
```

- [ ] **Step 5: Implement the minimal utilities**

`apps/web/lib/market-data/timeframes.js`

```js
export const TIMEFRAME_TO_MS = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1D": 86_400_000,
}

export function bucketTimestamp(timestamp, timeframe) {
  const width = TIMEFRAME_TO_MS[timeframe]
  if (!width) throw new Error(`Unsupported timeframe: ${timeframe}`)
  return Math.floor(timestamp / width) * width
}
```

`apps/web/lib/market-data/candle-aggregation.js`

```js
import { bucketTimestamp } from "./timeframes.js"

export function extractMarketLedgerChange(bookChangesResult, currencyA, currencyB) {
  return (bookChangesResult.changes ?? []).find(
    (change) => change.currency_a === currencyA && change.currency_b === currencyB
  ) ?? null
}

export function aggregateLedgerChangesToCandles(results, timeframe) {
  const buckets = new Map()

  for (const result of results) {
    const bucket = bucketTimestamp((result.ledger_time + 946684800) * 1000, timeframe)
    const change = extractMarketLedgerChange(result, "XRP_drops", "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs/USD")
    if (!change) continue

    const open = Number(change.open) / 1_000_000
    const high = Number(change.high) / 1_000_000
    const low = Number(change.low) / 1_000_000
    const close = Number(change.close) / 1_000_000

    const existing = buckets.get(bucket)
    if (!existing) {
      buckets.set(bucket, { time: bucket / 1000, open, high, low, close })
    } else {
      existing.high = Math.max(existing.high, high)
      existing.low = Math.min(existing.low, low)
      existing.close = close
    }
  }

  return [...buckets.values()].sort((a, b) => a.time - b.time)
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm --filter web exec node --test lib/market-data/timeframes.test.js lib/market-data/candle-aggregation.test.js
git add apps/web/package.json pnpm-lock.yaml apps/web/scripts/capture-xrpl-market-data.mjs apps/web/lib/fixtures/xrp-rlusd.book-changes.json apps/web/lib/fixtures/xrp-rlusd.book-offers.json apps/web/lib/market-data/timeframes.js apps/web/lib/market-data/timeframes.test.js apps/web/lib/market-data/candle-aggregation.js apps/web/lib/market-data/candle-aggregation.test.js
git commit -m "feat: add xrpl candle aggregation primitives"
```

---

### Task 4: Implement `useXRPLMarketData` And Replace The Sparkline With A Real Chart

**Files:**
- Create: `apps/web/lib/market-data/xrpl-market-feed.js`, `apps/web/hooks/useXRPLMarketData.js`, `apps/web/components/app/TradingChart.js`, `apps/web/lib/trade-terminal.test.js`
- Modify: `apps/web/lib/xrplClient.js`, `apps/web/components/app/TradeSpotWorkspace.js`
- Test: `apps/web/lib/trade-terminal.test.js`

- [ ] **Step 1: Write the failing terminal-composition test**

`apps/web/lib/trade-terminal.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

test("trade terminal uses the XRPL market-data hook and TradingChart instead of Sparkline", () => {
  const source = readSource("../components/app/TradeSpotWorkspace.js")
  assert.match(source, /useXRPLMarketData/)
  assert.match(source, /TradingChart/)
  assert.doesNotMatch(source, /function Sparkline/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test lib/trade-terminal.test.js`

Expected: FAIL because the workspace still uses the inline `Sparkline` component and `useSpotMarket`.

- [ ] **Step 3: Add the XRPL market-feed helper**

Create `apps/web/lib/market-data/xrpl-market-feed.js`:

```js
import { getClient } from "../xrplClient"

export async function fetchLiveBook(market) {
  const client = await getClient()
  const [asksResponse, bidsResponse] = await Promise.all([
    client.request({
      command: "book_offers",
      taker_pays: { currency: market.quoteCurrency, issuer: market.quoteIssuer },
      taker_gets: { currency: "XRP" },
      limit: 20,
    }),
    client.request({
      command: "book_offers",
      taker_pays: { currency: "XRP" },
      taker_gets: { currency: market.quoteCurrency, issuer: market.quoteIssuer },
      limit: 20,
    }),
  ])

  return {
    asks: asksResponse.result.offers ?? [],
    bids: bidsResponse.result.offers ?? [],
  }
}
```

- [ ] **Step 4: Implement the market-data hook and chart component**

`apps/web/hooks/useXRPLMarketData.js`

```js
"use client"

import { useEffect, useMemo, useState } from "react"

import { aggregateLedgerChangesToCandles } from "../lib/market-data/candle-aggregation"
import { fetchLiveBook } from "../lib/market-data/xrpl-market-feed"

export function useXRPLMarketData({ market, timeframe }) {
  const [candles, setCandles] = useState([])
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] })
  const [recentTrades, setRecentTrades] = useState([])

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const nextBook = await fetchLiveBook(market)
      if (!cancelled) setOrderBook(nextBook)
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), 10_000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [market, timeframe])

  const bestBid = useMemo(() => orderBook.bids[0] ?? null, [orderBook.bids])
  const bestAsk = useMemo(() => orderBook.asks[0] ?? null, [orderBook.asks])

  return { candles, orderBook, recentTrades, bestBid, bestAsk }
}
```

`apps/web/components/app/TradingChart.js`

```jsx
"use client"

import { useEffect, useRef } from "react"
import { createChart, CandlestickSeries } from "lightweight-charts"

export function TradingChart({ candles }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    const chart = createChart(containerRef.current, { autoSize: true, layout: { background: { color: "#080808" }, textColor: "#f5f2bb" } })
    const series = chart.addSeries(CandlestickSeries)
    chartRef.current = chart
    seriesRef.current = series
    return () => chart.remove()
  }, [])

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(candles)
    }
  }, [candles])

  return <div ref={containerRef} className="h-[420px] w-full" />
}
```

- [ ] **Step 5: Replace `Sparkline` inside `TradeSpotWorkspace`**

Use this shape:

```jsx
const { candles, orderBook, recentTrades, bestBid, bestAsk } = useXRPLMarketData({
  market,
  timeframe,
})

<TradingChart candles={candles} />
```

Also add timeframe buttons:

```jsx
{["1m", "5m", "15m", "1h", "4h", "1D"].map((entry) => (
  <button key={entry} type="button" onClick={() => setTimeframe(entry)}>
    {entry}
  </button>
))}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm --filter web exec node --test lib/trade-terminal.test.js lib/market-data/timeframes.test.js lib/market-data/candle-aggregation.test.js
git add apps/web/lib/market-data/xrpl-market-feed.js apps/web/hooks/useXRPLMarketData.js apps/web/components/app/TradingChart.js apps/web/components/app/TradeSpotWorkspace.js apps/web/lib/trade-terminal.test.js apps/web/lib/xrplClient.js
git commit -m "feat: add xrpl chart and market data hook"
```

---

### Task 5: Harden Native Spot Execution And The Orders Backoffice

**Files:**
- Create: `apps/web/lib/order-lifecycle.js`, `apps/web/lib/order-lifecycle.test.js`
- Modify: `apps/web/hooks/useSpotOrders.js`, `apps/web/lib/spot-order.js`, `apps/web/lib/spot-order.test.js`, `apps/web/components/app/OrdersWorkspace.js`, `apps/web/components/app/TradeSpotWorkspace.js`
- Test: `apps/web/lib/order-lifecycle.test.js`, `apps/web/lib/spot-order.test.js`

- [ ] **Step 1: Write failing lifecycle tests**

`apps/web/lib/order-lifecycle.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"

import { getOpenOrderStatus, toOrderRow } from "./order-lifecycle.js"

test("open offers normalize to the open status", () => {
  assert.equal(getOpenOrderStatus({ sequence: 7 }), "open")
})

test("toOrderRow returns the canonical table shape", () => {
  const row = toOrderRow({
    sequence: 7,
    side: "buy",
    type: "limit",
    price: 0.5,
    baseAmount: 3,
    quoteAmount: 1.5,
  })

  assert.deepEqual(Object.keys(row), [
    "id",
    "sequence",
    "side",
    "type",
    "status",
    "price",
    "baseAmount",
    "quoteAmount",
  ])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter web exec node --test lib/order-lifecycle.test.js lib/spot-order.test.js
```

Expected: FAIL because `order-lifecycle.js` does not exist.

- [ ] **Step 3: Add a pure lifecycle mapper**

`apps/web/lib/order-lifecycle.js`

```js
export function getOpenOrderStatus() {
  return "open"
}

export function toOrderRow(order) {
  return {
    id: `native:${order.sequence}`,
    sequence: order.sequence,
    side: order.side,
    type: order.type,
    status: getOpenOrderStatus(order),
    price: order.price,
    baseAmount: order.baseAmount,
    quoteAmount: order.quoteAmount,
  }
}
```

- [ ] **Step 4: Make `useSpotOrders` and `OrdersWorkspace` use canonical rows**

In `apps/web/hooks/useSpotOrders.js`, return rows already normalized through `toOrderRow`.

In `apps/web/components/app/OrdersWorkspace.js`, make the tabs explicit:

```jsx
const TABS = [
  ["open", "Open orders"],
  ["history", "Order history"],
  ["trades", "Trade history"],
]
```

Display `status` in the table and keep cancel actions only for `open` rows.

- [ ] **Step 5: Tighten `buildSpotOfferCreateTx` error paths**

Add test cases like:

```js
test("buildSpotOfferCreateTx rejects invalid side", () => {
  assert.throws(() =>
    buildSpotOfferCreateTx({
      account: "rBad",
      side: "hold",
      baseAmount: "3",
      limitPrice: "0.5",
    })
  )
})
```

Run:

```bash
pnpm --filter web exec node --test lib/order-lifecycle.test.js lib/spot-order.test.js
```

- [ ] **Step 6: Run full web verification and commit**

Run:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
git add apps/web/lib/order-lifecycle.js apps/web/lib/order-lifecycle.test.js apps/web/hooks/useSpotOrders.js apps/web/lib/spot-order.js apps/web/lib/spot-order.test.js apps/web/components/app/OrdersWorkspace.js apps/web/components/app/TradeSpotWorkspace.js
git commit -m "feat: harden native spot execution surfaces"
```

---

### Task 6: Add Contract-Ready Advanced-Order Domain Files Without Faking Execution

**Files:**
- Create: `apps/web/lib/advanced-orders/statuses.js`, `apps/web/lib/advanced-orders/drafts.js`, `apps/web/lib/advanced-orders.test.js`, `packages/advanced-orders/README.md`
- Modify: `apps/web/components/app/TradeSpotWorkspace.js`, `apps/web/components/app/OrdersWorkspace.js`, `apps/web/lib/app-shell.js`
- Test: `apps/web/lib/advanced-orders.test.js`

- [ ] **Step 1: Write failing advanced-order domain tests**

`apps/web/lib/advanced-orders.test.js`

```js
import test from "node:test"
import assert from "node:assert/strict"

import { ADVANCED_ORDER_STATUSES, createAdvancedOrderDraft } from "./advanced-orders/drafts.js"

test("advanced-order domain exposes the canonical status vocabulary", () => {
  assert.deepEqual(ADVANCED_ORDER_STATUSES, [
    "draft",
    "awaiting signature",
    "submitted",
    "pending confirmation",
    "active",
    "tracking",
    "triggered",
    "executing",
    "open",
    "partially filled",
    "filled",
    "completed",
    "cancelled",
    "failed",
    "expired",
  ])
})

test("createAdvancedOrderDraft keeps market, type, side, and trigger fields together", () => {
  const draft = createAdvancedOrderDraft({
    market: "xrp-rlusd",
    type: "STOP_LOSS",
    side: "SELL",
  })

  assert.equal(draft.market, "xrp-rlusd")
  assert.equal(draft.type, "STOP_LOSS")
  assert.equal(draft.status, "draft")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec node --test lib/advanced-orders.test.js`

Expected: FAIL because the files do not exist yet.

- [ ] **Step 3: Implement the domain helpers**

`apps/web/lib/advanced-orders/statuses.js`

```js
export const ADVANCED_ORDER_STATUSES = [
  "draft",
  "awaiting signature",
  "submitted",
  "pending confirmation",
  "active",
  "tracking",
  "triggered",
  "executing",
  "open",
  "partially filled",
  "filled",
  "completed",
  "cancelled",
  "failed",
  "expired",
]
```

`apps/web/lib/advanced-orders/drafts.js`

```js
import { ADVANCED_ORDER_STATUSES } from "./statuses.js"

export { ADVANCED_ORDER_STATUSES }

export function createAdvancedOrderDraft({ market, type, side }) {
  return {
    id: null,
    market,
    type,
    side,
    status: ADVANCED_ORDER_STATUSES[0],
    createdAt: null,
    trigger: null,
    schedule: null,
  }
}
```

- [ ] **Step 4: Surface the domain in the terminal and orders page without pretending it is live**

In `apps/web/components/app/TradeSpotWorkspace.js`, replace generic placeholder copy with explicit contract-facing wording:

```jsx
<p className="mt-2 museum-copy">
  This tool uses the final advanced-order domain model now, but its on-chain executor is not wired in this pass.
</p>
```

In `apps/web/components/app/OrdersWorkspace.js`, add a dedicated section or tab label for advanced schedules:

```jsx
["advanced", "Advanced schedules"]
```

Do **not** fake rows. Show an honest empty state:

```jsx
<p className="text-sm exchange-muted">
  Advanced orders and schedules will appear here once the on-chain executor is integrated.
</p>
```

- [ ] **Step 5: Add the contract package scaffold note**

Create `packages/advanced-orders/README.md`:

```md
# Advanced Orders Package

This package is reserved for the future on-chain advanced-order engine and its shared interface code.

It is intentionally not implemented in the frontend-first MVP pass because the target smart-contract environment documentation still needs to be locked before code is written.
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm --filter web exec node --test lib/advanced-orders.test.js
git add apps/web/lib/advanced-orders/statuses.js apps/web/lib/advanced-orders/drafts.js apps/web/lib/advanced-orders.test.js apps/web/components/app/TradeSpotWorkspace.js apps/web/components/app/OrdersWorkspace.js packages/advanced-orders/README.md
git commit -m "feat: add contract-ready advanced order domain"
```

---

### Task 7: Final Cleanup, Documentation Sweep, And Release Verification

**Files:**
- Modify: `README.md`, `docs/architecture.md`, `docs/roadmap.md`, `apps/web/lib/app-routes.test.js`, `apps/web/lib/app-shell.test.js`, `apps/web/lib/landing-page.test.js` (only if route references changed), any remaining app-shell files touched in earlier tasks
- Test: full `web` suite

- [ ] **Step 1: Update docs to reflect the exact live product**

The docs must now say:

```md
- live market: XRP / RLUSD
- live native execution: limit place/cancel
- chart: Lightweight Charts + browser-side XRPL aggregation
- advanced orders: contract-ready frontend domain, executor pending separate implementation track
```

- [ ] **Step 2: Remove stale references from tests and copy**

Run:

```bash
rg -n "watcher|loan|XRP / USDC|XRP / EURC|RLUSD / XRP|Sparkline|AppExperience|EarnYieldPage|LoansPage" apps/web README.md docs
```

Expected: no stale references remain in active code; only intentional historical mentions survive in spec/plan docs.

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
```

Expected:

- `test`: PASS
- `lint`: PASS
- `build`: PASS

Non-blocking note: the existing `baseline-browser-mapping` freshness warning may still appear during lint/build.

- [ ] **Step 4: Inspect the final git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the intended frontend/doc changes remain staged or unstaged; no accidental leftovers from watcher/loan deletions.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/architecture.md docs/roadmap.md apps/web
git add -u
git commit -m "chore: finalize frontend v1 mvp foundation"
```

---

## Follow-Up Plan Required After This One

This plan intentionally stops before the real on-chain advanced-order executor is implemented.

Write a dedicated follow-up plan only after collecting the missing contract-environment references:

- target XRPL smart-contract environment docs
- deployment/build toolchain
- contract storage model
- event / state read pattern from the frontend
- cancellation / execution transaction model

That follow-up plan should cover:

- stop-loss executor
- take-profit executor
- OCO executor
- trailing-stop state tracking
- DCA / TWAP schedule execution
- frontend / contract integration and reconciliation
