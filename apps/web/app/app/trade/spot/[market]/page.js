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
