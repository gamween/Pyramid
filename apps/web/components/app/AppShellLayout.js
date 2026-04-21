"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useWalletManager } from "../../hooks/useWalletManager"
import { DEFAULT_NETWORK } from "../../lib/networks"
import { APP_PRIMARY_NAV } from "../../lib/app-shell"
import { useWallet } from "../providers/WalletProvider"
import { WalletConnector } from "../WalletConnector"

function isActiveLink(pathname, href) {
  if (href === "/app/trade/spot") {
    return pathname.startsWith("/app/trade/spot")
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function shortenAddress(address) {
  if (!address) return null
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function AppShellLayout({ children }) {
  useWalletManager()

  const pathname = usePathname()
  const { isConnected, accountInfo } = useWallet()

  return (
    <div className="exchange-shell min-h-screen">
      <div className="sticky top-0 z-40 border-b museum-rule bg-[rgba(230,237,1,0.9)] backdrop-blur">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="font-ui text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70"
              >
                Pyramid
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <span className="exchange-chip px-2 py-1 font-ui text-[10px] uppercase tracking-[0.12em]">
                  {DEFAULT_NETWORK.name}
                </span>
                <span className="exchange-chip px-2 py-1 font-ui text-[10px] uppercase tracking-[0.12em]">
                  Front-only
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && accountInfo?.address ? (
                <div className="hidden md:block exchange-chip px-3 py-2 font-ui text-[11px] uppercase tracking-[0.12em]">
                  {shortenAddress(accountInfo.address)}
                </div>
              ) : null}
              <WalletConnector />
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {APP_PRIMARY_NAV.map((item, index) => {
              const active = isActiveLink(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border px-3 py-3 font-ui text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "border-[color:var(--museum-ink)] bg-[rgba(1,0,1,0.94)] text-[var(--museum-bg)]"
                      : "border-[color:var(--museum-line)] bg-[rgba(1,0,1,0.04)] hover:bg-[rgba(1,0,1,0.08)]"
                  }`}
                >
                  <span className="mr-2 opacity-60">[{String(index + 1).padStart(2, "0")}]</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <main className="px-4 pb-10 pt-6 md:px-8 lg:px-10">{children}</main>
    </div>
  )
}
