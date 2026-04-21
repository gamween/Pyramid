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
