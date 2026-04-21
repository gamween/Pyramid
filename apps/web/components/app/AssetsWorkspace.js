"use client"

import { RefreshCcw, Wallet } from "lucide-react"

import { useWallet } from "../providers/WalletProvider"
import { useAccountPortfolio } from "../../hooks/useAccountPortfolio"
import { AppPageHeader } from "./AppPageHeader"
import { AppPanel } from "./AppPanel"

export function AssetsWorkspace() {
  const { isConnected } = useWallet()
  const { summary, assets, history, loading, error, hasData, refresh } = useAccountPortfolio()

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Assets"
        title="Account overview"
        description="Balances, allocations, and account history from direct XRPL reads. No watcher cache, no shadow portfolio service."
        meta={["Devnet", "Direct reads", "Wallet-signed"]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <AppPanel
          eyebrow="Portfolio"
          title="Balances"
          description={
            hasData
              ? "Native XRP plus issued balances for the connected account."
              : "Connect a wallet to read live balances from XRPL devnet."
          }
          actions={
            <button
              type="button"
              onClick={() => void refresh()}
              className="exchange-chip inline-flex items-center gap-2 px-3 py-2 font-ui text-[11px] uppercase tracking-[0.14em]"
            >
              <RefreshCcw className="size-3.5" />
              Refresh
            </button>
          }
        >
          {!isConnected ? (
            <div className="flex min-h-56 items-center justify-center border museum-rule bg-[rgba(1,0,1,0.03)] p-6 text-center">
              <div className="space-y-3">
                <Wallet className="mx-auto size-7 text-[color:var(--museum-muted)]" />
                <p className="font-display text-3xl">Connect a wallet</p>
                <p className="museum-copy max-w-md text-sm leading-7">
                  The assets page only reads the connected account directly from XRPL devnet. Nothing is cached server-side.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
                  <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    XRP balance
                  </p>
                  <p className="mt-3 font-display text-4xl">{summary?.xrpBalance?.toFixed(2) ?? "—"}</p>
                </div>
                <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
                  <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Trust lines
                  </p>
                  <p className="mt-3 font-display text-4xl">{summary?.trustLineCount ?? "—"}</p>
                </div>
                <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
                  <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Owner count
                  </p>
                  <p className="mt-3 font-display text-4xl">{summary?.ownerCount ?? "—"}</p>
                </div>
                <div className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4">
                  <p className="font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                    Sequence
                  </p>
                  <p className="mt-3 font-display text-4xl">{summary?.sequence ?? "—"}</p>
                </div>
              </div>

              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {loading ? <p className="museum-copy text-sm">Loading live account state…</p> : null}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b museum-rule font-ui text-[10px] uppercase tracking-[0.16em] text-[color:var(--museum-muted)]">
                      <th className="pb-3 pr-4 font-medium">Asset</th>
                      <th className="pb-3 pr-4 font-medium">Issuer</th>
                      <th className="pb-3 pr-4 font-medium">Balance</th>
                      <th className="pb-3 font-medium">Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr
                        key={`${asset.symbol}:${asset.issuer}`}
                        className="border-b [border-color:rgba(1,0,1,0.08)]"
                      >
                        <td className="py-3 pr-4 font-semibold">{asset.symbol}</td>
                        <td className="py-3 pr-4 text-sm exchange-muted">{asset.issuer}</td>
                        <td className="py-3 pr-4">{asset.balance}</td>
                        <td className="py-3">{asset.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AppPanel>

        <AppPanel
          eyebrow="History"
          title="Recent account activity"
          description="Latest ledger-confirmed transactions for the connected account."
        >
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="museum-copy text-sm leading-7">
                {isConnected
                  ? "No activity returned yet for the current account."
                  : "History appears after a wallet is connected."}
              </p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.hash}
                  className="border museum-rule bg-[rgba(1,0,1,0.03)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-ui text-[10px] uppercase tracking-[0.14em] text-[color:var(--museum-muted)]">
                        {entry.type}
                      </p>
                      <p className="mt-2 text-sm font-medium">{entry.result}</p>
                    </div>
                    <p className="text-right text-xs exchange-muted">{entry.timestamp}</p>
                  </div>
                  <p className="mt-3 text-xs exchange-muted break-all">{entry.hash}</p>
                </div>
              ))
            )}
          </div>
        </AppPanel>
      </div>
    </div>
  )
}
