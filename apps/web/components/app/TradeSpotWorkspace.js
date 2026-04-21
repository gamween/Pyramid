"use client"

import { useMemo, useState } from "react"

import { FUTURE_APP_MODULES, V1_TRADE_TOOLS } from "../../lib/app-shell"
import { useXRPLMarketData } from "../../hooks/useXRPLMarketData"
import { useSpotOrders } from "../../hooks/useSpotOrders"
import { AppPageHeader } from "./AppPageHeader"
import { AppPanel } from "./AppPanel"
import { TradingChart } from "./TradingChart"

const TIMEFRAME_OPTIONS = ["1m", "5m", "15m", "1h", "4h", "1D"]

function formatPrice(value) {
  return value == null ? "—" : value.toFixed(6)
}

function formatAmount(value) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—"
}

export function TradeSpotWorkspace({ market }) {
  const [side, setSide] = useState("buy")
  const [tool, setTool] = useState("limit")
  const [amount, setAmount] = useState("25")
  const [price, setPrice] = useState("0.55")
  const [actionMessage, setActionMessage] = useState("")

  const {
    market: liveMarket,
    asks,
    bids,
    candles,
    bestBid,
    bestAsk,
    midPrice,
    spreadBps,
    timeframe,
    setTimeframe,
    timeframeLocked,
    seedNote,
    loading: marketLoading,
    error: marketError,
  } = useXRPLMarketData(market)
  const {
    hasAccount,
    openOrders,
    orderHistory,
    placeLimitOrder,
    cancelOrder,
    loading: orderLoading,
    error: orderError,
  } = useSpotOrders()
  const activeMarket = market ?? liveMarket

  const activeTool = useMemo(
    () => [...V1_TRADE_TOOLS, ...FUTURE_APP_MODULES].find((entry) => entry.key === tool),
    [tool]
  )

  async function handlePlaceLimitOrder(event) {
    event.preventDefault()

    try {
      const result = await placeLimitOrder({
        side,
        baseAmount: amount,
        limitPrice: price,
      })
      setActionMessage(`Submitted ${side.toUpperCase()} limit order: ${result.hash}`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to submit order")
    }
  }

  async function handleCancel(sequence) {
    try {
      const result = await cancelOrder(sequence)
      setActionMessage(`Cancelled order ${sequence}: ${result.hash}`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to cancel order")
    }
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Trade / Spot"
        title={activeMarket.symbol}
        description="Live direct-read order book plus a route structure that keeps V1 tools primary and future modules visible without pretending they already execute on-chain."
        meta={["Spot", "Place / cancel live", "SL / TP / OCO scaffolded"]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)_minmax(0,0.95fr)]">
        <AppPanel
          eyebrow="Chart"
          title={activeMarket.shortLabel}
          description="Truthful XRP / RLUSD candles seeded from captured ledger changes, with live XRPL book depth refreshing underneath."
          tone="dark"
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Mid</p>
                <p className="mt-2 font-display text-5xl">{formatPrice(midPrice)}</p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Bid</p>
                <p className="mt-2 font-display text-5xl">{formatPrice(bestBid)}</p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Ask</p>
                <p className="mt-2 font-display text-5xl">{formatPrice(bestAsk)}</p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Spread</p>
                <p className="mt-2 font-display text-5xl">
                  {spreadBps == null ? "—" : `${spreadBps.toFixed(1)} bps`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {TIMEFRAME_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTimeframe(option)}
                  disabled={timeframeLocked && timeframe !== option}
                  className={`border px-3 py-2 font-ui text-[10px] uppercase tracking-[0.16em] ${
                    timeframe === option
                      ? "border-[#e6ed01] bg-[#e6ed01] text-[var(--museum-ink)]"
                      : "border-white/15 bg-transparent text-[#cfcaa0] disabled:cursor-not-allowed disabled:opacity-45"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#9c9671]">
              <span className="font-ui uppercase tracking-[0.14em] text-[#cfcaa0]">
                Seeded ledger snapshot
              </span>{" "}
              {seedNote}
            </p>

            <TradingChart candles={candles} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 p-3">
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">
                  Open orders
                </p>
                <div className="mt-3 space-y-2">
                  {openOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold uppercase">{order.side}</p>
                        <p className="text-[#cfcaa0]">
                          {order.status} · {formatAmount(order.baseAmount)} XRP @ {formatPrice(order.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCancel(order.sequence)}
                        className="border border-white/15 px-3 py-1 font-ui text-[10px] uppercase tracking-[0.14em]"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                  {openOrders.length === 0 ? <p className="text-sm text-[#9c9671]">No open offers on-ledger.</p> : null}
                </div>
              </div>

              <div className="border border-white/10 p-3">
                <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">
                  Ledger activity
                </p>
                <div className="mt-3 space-y-2">
                  {orderHistory.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="text-sm">
                      <p className="font-semibold">{entry.type}</p>
                      <p className="text-[#cfcaa0]">
                        {entry.status} · {entry.txResult ?? "Pending"} · {entry.timestamp}
                      </p>
                    </div>
                  ))}
                  {orderHistory.length === 0 ? <p className="text-sm text-[#9c9671]">No recent offer transactions yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </AppPanel>

        <div className="space-y-6">
          <AppPanel
            eyebrow="Order book"
            title="Live depth"
            description="Top visible levels from the active XRP / RLUSD book."
            tone="dark"
          >
            <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-2 font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">
              <span>Price</span>
              <span>Amount</span>
              <span>Total</span>
            </div>

            <div className="mt-3 space-y-6 text-sm">
              <div>
                <p className="mb-2 font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Asks</p>
                <div className="space-y-1.5">
                  {asks.slice(0, 6).map((row, index) => (
                    <div key={`ask:${index}`} className="grid grid-cols-3 gap-2 text-[#f0b2a8]">
                      <span>{formatPrice(row.price)}</span>
                      <span>{formatAmount(row.amount)}</span>
                      <span>{formatAmount(row.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-ui text-[10px] uppercase tracking-[0.16em] text-[#9c9671]">Bids</p>
                <div className="space-y-1.5">
                  {bids.slice(0, 6).map((row, index) => (
                    <div key={`bid:${index}`} className="grid grid-cols-3 gap-2 text-[#cdef83]">
                      <span>{formatPrice(row.price)}</span>
                      <span>{formatAmount(row.amount)}</span>
                      <span>{formatAmount(row.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {marketLoading ? <p className="mt-4 text-sm text-[#9c9671]">Refreshing order book…</p> : null}
            {marketError ? <p className="mt-4 text-sm text-red-300">{marketError}</p> : null}
          </AppPanel>

          <AppPanel
            eyebrow="Roadmap modules"
            title="Future layers"
            description="Visible now so the product scope stays legible, but not presented as active execution logic."
          >
            <div className="space-y-3">
              {FUTURE_APP_MODULES.map((module) => (
                <div key={module.key} className="flex items-center justify-between border museum-rule bg-[rgba(1,0,1,0.03)] px-3 py-3">
                  <span className="font-medium">{module.label}</span>
                  <span className="exchange-chip px-2 py-1 font-ui text-[10px] uppercase tracking-[0.12em]">
                    {module.stage}
                  </span>
                </div>
              ))}
            </div>
          </AppPanel>
        </div>

        <AppPanel
          eyebrow="Order entry"
          title="Place on-ledger offers"
          description="Limit placement is wired directly from the wallet. Advanced trigger tools are scaffolded and intentionally not faked."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {["buy", "sell"].map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setSide(entry)}
                  className={`border px-3 py-3 font-ui text-[11px] uppercase tracking-[0.16em] ${
                    side === entry
                      ? "border-[color:var(--museum-ink)] bg-[rgba(1,0,1,0.92)] text-[var(--museum-bg)]"
                      : "border-[color:var(--museum-line)] bg-transparent"
                  }`}
                >
                  {entry}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[...V1_TRADE_TOOLS, ...FUTURE_APP_MODULES].map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setTool(entry.key)}
                  className={`border px-3 py-3 text-left ${
                    tool === entry.key
                      ? "border-[color:var(--museum-ink)] bg-[rgba(1,0,1,0.08)]"
                      : "border-[color:var(--museum-line)] bg-transparent"
                  }`}
                >
                  <span className="block font-medium">{entry.label}</span>
                  <span className="mt-1 block font-ui text-[10px] uppercase tracking-[0.12em] text-[color:var(--museum-muted)]">
                    {entry.stage}
                  </span>
                </button>
              ))}
            </div>

            {activeTool?.key === "limit" ? (
              <form className="space-y-4" onSubmit={handlePlaceLimitOrder}>
                <div className="space-y-2">
                  <label className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Amount (XRP)
                  </label>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full border museum-rule bg-transparent px-3 py-3 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Limit price (RLUSD per XRP)
                  </label>
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="w-full border museum-rule bg-transparent px-3 py-3 outline-none"
                  />
                </div>

                <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4 text-sm">
                  <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Order preview
                  </p>
                  <p className="mt-3">
                    {side.toUpperCase()} {amount || "0"} XRP @ {price || "0"} RLUSD
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!hasAccount || orderLoading}
                  className="w-full border border-[color:var(--museum-ink)] bg-[rgba(1,0,1,0.92)] px-4 py-4 font-ui text-[11px] uppercase tracking-[0.18em] text-[var(--museum-bg)] disabled:opacity-40"
                >
                  {orderLoading ? "Submitting…" : "Place limit order"}
                </button>
              </form>
            ) : (
              <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4 text-sm leading-7">
                <p className="font-medium">{activeTool?.label}</p>
                <p className="mt-2 museum-copy">
                  This surface is visible now so the terminal reflects the full product vision, but execution is intentionally deferred until the direct on-chain workflow is ready.
                </p>
              </div>
            )}

            {!hasAccount ? (
              <p className="museum-copy text-sm">
                Connect a wallet before placing or cancelling offers.
              </p>
            ) : null}
            {actionMessage ? <p className="text-sm">{actionMessage}</p> : null}
            {orderError ? <p className="text-sm text-red-700">{orderError}</p> : null}
          </div>
        </AppPanel>
      </div>
    </div>
  )
}
