import { ADDRESSES } from "./constants.js"

export const ACTIVE_SPOT_MARKET = {
  id: "xrp-rlusd",
  symbol: "XRP / RLUSD",
  shortLabel: "XRP/RLUSD",
  baseCode: "XRP",
  quoteCode: "RLUSD",
  quoteCurrency: "USD",
  quoteIssuer: ADDRESSES.RLUSD_ISSUER,
  stage: "live",
  notes: "Direct XRPL devnet book read",
}

export const MARKET_WATCHLIST = [
  ACTIVE_SPOT_MARKET,
  {
    id: "xrp-usdc",
    symbol: "XRP / USDC",
    shortLabel: "XRP/USDC",
    stage: "planned",
    notes: "Issuer wiring next",
  },
  {
    id: "xrp-eurc",
    symbol: "XRP / EURC",
    shortLabel: "XRP/EURC",
    stage: "planned",
    notes: "Issuer wiring next",
  },
  {
    id: "rlusd-xrp",
    symbol: "RLUSD / XRP",
    shortLabel: "RLUSD/XRP",
    stage: "derived",
    notes: "Display surface for quote inversion",
  },
]
