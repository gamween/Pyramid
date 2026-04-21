import { ACTIVE_SPOT_MARKET } from "./market-registry.js"

export const APP_PRIMARY_NAV = [
  { key: "assets", href: "/app/assets", label: "Assets" },
  { key: "markets", href: "/app/markets", label: "Markets" },
  { key: "trade", href: "/app/trade/spot", label: "Trade" },
  { key: "orders", href: "/app/orders", label: "Orders" },
]

export const DEFAULT_APP_ROUTE = APP_PRIMARY_NAV[0].href

export const LIVE_TRADE_ROUTE = {
  href: `/app/trade/spot/${ACTIVE_SPOT_MARKET.slug}`,
  label: "Spot",
  stage: "live",
}

export const V1_TRADE_TOOLS = [
  { key: "limit", label: "Limit", stage: "live" },
  { key: "market", label: "Market", stage: "placeholder" },
  { key: "stop-loss", label: "Stop-loss", stage: "placeholder" },
  { key: "take-profit", label: "Take-profit", stage: "placeholder" },
  { key: "oco", label: "OCO", stage: "placeholder" },
]

export const FUTURE_APP_MODULES = [
  { key: "trailing-stop", label: "Trailing stop", stage: "placeholder" },
  { key: "dca", label: "DCA", stage: "placeholder" },
  { key: "twap", label: "TWAP", stage: "placeholder" },
  { key: "lending", label: "Lending", stage: "later" },
  { key: "privacy", label: "Privacy", stage: "later" },
]
