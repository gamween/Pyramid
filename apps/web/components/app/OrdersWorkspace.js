"use client"

import { useMemo, useState } from "react"

import { useSpotOrders } from "../../hooks/useSpotOrders"
import { AppPageHeader } from "./AppPageHeader"
import { AppPanel } from "./AppPanel"

const TABS = [
  ["open", "Open orders"],
  ["history", "Order history"],
  ["trades", "Trade history"],
  ["advanced", "Advanced schedules"],
]

function formatPrice(value) {
  return value == null ? "—" : value.toFixed(6)
}

function formatAmount(value) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—"
}

function formatTxResult(value) {
  return value ?? "—"
}

export function OrdersWorkspace() {
  const [tab, setTab] = useState("open")
  const [sideFilter, setSideFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")

  const { hasAccount, openOrders, orderHistory, tradeHistory, cancelOrder, loading, error } = useSpotOrders()

  const rows = useMemo(() => {
    return tab === "open" ? openOrders : tab === "history" ? orderHistory : tradeHistory
  }, [openOrders, orderHistory, tab, tradeHistory])

  const filteredRows = useMemo(() => {
    return rows.filter((order) => {
      const sideMatches = sideFilter === "all" ? true : order.side === sideFilter
      const queryMatches =
        query.trim() === ""
          ? true
          : `${order.sequence ?? ""} ${order.side ?? ""} ${order.type ?? ""} ${order.status ?? ""}`
              .concat(` ${order.txResult ?? ""}`)
              .toLowerCase()
              .includes(query.trim().toLowerCase())

      return sideMatches && queryMatches
    })
  }, [query, rows, sideFilter])

  async function handleCancel(sequence) {
    try {
      const result = await cancelOrder(sequence)
      setMessage(`Cancelled order ${sequence}: ${result.hash}`)
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to cancel order")
    }
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Orders"
        title="Order backoffice"
        description="Dedicated order management separated from the terminal so open orders, history, and future execution tooling all have clear space."
        meta={["Open orders", "History", "Filters"]}
      />

      <AppPanel
        eyebrow="Desk"
        title="Filters and history"
        description="Exchange-style order management from direct ledger reads. No watcher cache and no fake off-chain order store."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`border px-3 py-2 font-ui text-[11px] uppercase tracking-[0.16em] ${
                    tab === value
                      ? "border-[color:var(--museum-ink)] bg-[rgba(1,0,1,0.92)] text-[var(--museum-bg)]"
                      : "border-[color:var(--museum-line)] bg-transparent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "advanced" ? null : (
              <div className="flex flex-col gap-2 md:flex-row">
                <select
                  value={sideFilter}
                  onChange={(event) => setSideFilter(event.target.value)}
                  className="border museum-rule bg-transparent px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All sides</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by sequence or side"
                  className="border museum-rule bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
            )}
          </div>

          {!hasAccount && tab !== "advanced" ? (
            <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-5 text-sm leading-7">
              Connect a wallet to read on-ledger open offers and offer transaction history.
            </div>
          ) : null}

          {tab === "advanced" ? (
            <div className="space-y-4">
              <p className="text-sm exchange-muted">
                Advanced orders and schedules will appear here once the on-chain executor is
                integrated.
              </p>
            </div>
          ) : (
            <>
              {loading ? <p className="museum-copy text-sm">Refreshing direct ledger state…</p> : null}
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {message ? <p className="text-sm">{message}</p> : null}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b museum-rule font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                      {tab === "open" ? (
                        <>
                          <th className="pb-3 pr-4 font-medium">Sequence</th>
                          <th className="pb-3 pr-4 font-medium">Side</th>
                          <th className="pb-3 pr-4 font-medium">Type</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Price</th>
                          <th className="pb-3 pr-4 font-medium">Amount</th>
                          <th className="pb-3 pr-4 font-medium">Quote</th>
                          <th className="pb-3 font-medium text-right">Action</th>
                        </>
                      ) : (
                        <>
                          <th className="pb-3 pr-4 font-medium">Type</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">XRPL result</th>
                          <th className="pb-3 pr-4 font-medium">Sequence</th>
                          <th className="pb-3 pr-4 font-medium">Timestamp</th>
                          <th className="pb-3 font-medium">Hash</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tab === "open" ? 8 : 6}
                          className="py-8 text-center text-sm exchange-muted"
                        >
                          {tab === "trades"
                            ? "Trade history stays empty until direct fill parsing is wired."
                            : "No rows for the current filter."}
                        </td>
                      </tr>
                    ) : tab === "open" ? (
                      filteredRows.map((row) => (
                        <tr key={row.id} className="border-b [border-color:rgba(1,0,1,0.08)]">
                          <td className="py-3 pr-4 font-semibold">{row.sequence}</td>
                          <td className="py-3 pr-4 uppercase">{row.side}</td>
                          <td className="py-3 pr-4">{row.type}</td>
                          <td className="py-3 pr-4 uppercase">{row.status}</td>
                          <td className="py-3 pr-4">{formatPrice(row.price)}</td>
                          <td className="py-3 pr-4">{formatAmount(row.baseAmount)} XRP</td>
                          <td className="py-3 pr-4">{formatAmount(row.quoteAmount)} RLUSD</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => void handleCancel(row.sequence)}
                              className="border museum-rule px-3 py-2 font-ui text-[10px] uppercase tracking-[0.14em]"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id} className="border-b [border-color:rgba(1,0,1,0.08)]">
                          <td className="py-3 pr-4 font-semibold">{row.type}</td>
                          <td className="py-3 pr-4 uppercase">{row.status}</td>
                          <td className="py-3 pr-4">{formatTxResult(row.txResult)}</td>
                          <td className="py-3 pr-4">{row.sequence ?? "—"}</td>
                          <td className="py-3 pr-4 text-sm exchange-muted">{row.timestamp}</td>
                          <td className="py-3 break-all text-xs exchange-muted">{row.hash}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </AppPanel>
    </div>
  )
}
