"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { MARKET_WATCHLIST } from "../../lib/market-registry"
import { useSpotMarket } from "../../hooks/useSpotMarket"
import { AppPageHeader } from "./AppPageHeader"
import { AppPanel } from "./AppPanel"

function formatPrice(value) {
  return value == null ? "—" : value.toFixed(6)
}

export function MarketsWorkspace() {
  const [query, setQuery] = useState("")
  const { market, midPrice, bestBid, bestAsk, spreadBps, samples, loading, error } = useSpotMarket()

  const rows = useMemo(() => {
    return MARKET_WATCHLIST.filter((entry) =>
      entry.symbol.toLowerCase().includes(query.trim().toLowerCase())
    ).map((entry) => {
      if (entry.id === market.id) {
        return {
          ...entry,
          price: formatPrice(midPrice),
          bidAsk:
            bestBid != null && bestAsk != null
              ? `${formatPrice(bestBid)} / ${formatPrice(bestAsk)}`
              : "—",
          stats: spreadBps != null ? `${spreadBps.toFixed(2)} bps spread` : "Direct feed warming",
        }
      }

      if (entry.stage === "derived" && midPrice != null) {
        const inverted = midPrice > 0 ? 1 / midPrice : null
        return {
          ...entry,
          price: formatPrice(inverted),
          bidAsk: "Derived display",
          stats: "No separate book yet",
        }
      }

      return {
        ...entry,
        price: "—",
        bidAsk: "Issuer wiring next",
        stats: "Placeholder",
      }
    })
  }, [bestAsk, bestBid, market.id, midPrice, query, spreadBps])

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Markets"
        title="Spot discovery"
        description="XRPL devnet market discovery with one live tracked spot book and honest placeholders for the broader watchlist."
        meta={["Pairs", "Search", "Direct reads"]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <AppPanel
          eyebrow="Live book"
          title={market.symbol}
          description="This is the active direct-read market feeding the trade terminal."
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
              <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                Mid
              </p>
              <p className="mt-3 font-display text-4xl">{formatPrice(midPrice)}</p>
            </div>
            <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
              <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                Best bid
              </p>
              <p className="mt-3 font-display text-4xl">{formatPrice(bestBid)}</p>
            </div>
            <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
              <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                Best ask
              </p>
              <p className="mt-3 font-display text-4xl">{formatPrice(bestAsk)}</p>
            </div>
            <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
              <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                Spread
              </p>
              <p className="mt-3 font-display text-4xl">
                {spreadBps != null ? spreadBps.toFixed(2) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
              Session trace
            </p>
            <div className="grid gap-2 md:grid-cols-4">
              {samples.slice(-4).map((sample) => (
                <div key={sample.timestamp} className="border museum-rule bg-[rgba(1,0,1,0.03)] p-3">
                  <p className="text-sm font-semibold">{formatPrice(sample.price)}</p>
                  <p className="mt-1 text-xs exchange-muted">
                    {new Date(sample.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>

            {loading ? <p className="museum-copy text-sm">Refreshing live book…</p> : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>
        </AppPanel>

        <AppPanel
          eyebrow="Watchlist"
          title="Pairs"
          description="The page structure is real now. Pair coverage expands as each market gets a direct-read data path."
        >
          <label className="mb-4 flex items-center gap-3 border museum-rule bg-[rgba(1,0,1,0.03)] px-3 py-3">
            <Search className="size-4 text-[color:var(--museum-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pairs"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--museum-muted)]"
            />
          </label>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b museum-rule font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                  <th className="pb-3 pr-4 font-medium">Pair</th>
                  <th className="pb-3 pr-4 font-medium">Stage</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 pr-4 font-medium">Bid / Ask</th>
                  <th className="pb-3 font-medium">Stats</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id} className="border-b [border-color:rgba(1,0,1,0.08)]">
                    <td className="py-3 pr-4 font-semibold">{entry.symbol}</td>
                    <td className="py-3 pr-4">
                      <span className="exchange-chip px-2 py-1 font-ui text-[10px] uppercase tracking-[0.12em]">
                        {entry.stage}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{entry.price}</td>
                    <td className="py-3 pr-4 exchange-muted">{entry.bidAsk}</td>
                    <td className="py-3 exchange-muted">{entry.stats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppPanel>
      </div>
    </div>
  )
}
