import { ACTIVE_SPOT_MARKET } from "../market-registry.js"
import { requestXRPL } from "../xrplClient.js"

function readXrpAmount(value) {
  return Number(value ?? 0) / 1_000_000
}

function readIssuedAmount(value) {
  return Number(value?.value ?? 0)
}

function readFundedAmount(primary, funded, reader) {
  return reader(funded ?? primary)
}

function createRow(price, amount, total) {
  return {
    price,
    amount,
    total,
  }
}

function mapAskOffer(offer) {
  const amount = readFundedAmount(offer.TakerGets, offer.taker_gets_funded, readXrpAmount)
  const total = readFundedAmount(offer.TakerPays, offer.taker_pays_funded, readIssuedAmount)
  const price = amount > 0 ? total / amount : 0

  return createRow(price, amount, total)
}

function mapBidOffer(offer) {
  const amount = readFundedAmount(offer.TakerPays, offer.taker_pays_funded, readXrpAmount)
  const total = readFundedAmount(offer.TakerGets, offer.taker_gets_funded, readIssuedAmount)
  const price = amount > 0 ? total / amount : 0

  return createRow(price, amount, total)
}

export async function fetchXRPLMarketFeed({ market = ACTIVE_SPOT_MARKET, limit = 16 } = {}) {
  const [asksResponse, bidsResponse] = await Promise.all([
    requestXRPL({
      command: "book_offers",
      taker_pays: {
        currency: market.quoteCurrency,
        issuer: market.quoteIssuer,
      },
      taker_gets: { currency: market.baseCode },
      limit,
    }),
    requestXRPL({
      command: "book_offers",
      taker_pays: { currency: market.baseCode },
      taker_gets: {
        currency: market.quoteCurrency,
        issuer: market.quoteIssuer,
      },
      limit,
    }),
  ])

  const asks = (asksResponse.result.offers ?? [])
    .map(mapAskOffer)
    .filter((row) => row.price > 0 && row.amount > 0)
    .sort((left, right) => left.price - right.price)
  const bids = (bidsResponse.result.offers ?? [])
    .map(mapBidOffer)
    .filter((row) => row.price > 0 && row.amount > 0)
    .sort((left, right) => right.price - left.price)
  const bestAsk = asks[0]?.price ?? null
  const bestBid = bids[0]?.price ?? null
  const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid ?? null
  const spread = bestAsk && bestBid ? bestAsk - bestBid : null

  return {
    market,
    asks,
    bids,
    bestAsk,
    bestBid,
    midPrice,
    spread,
    updatedAt: Date.now(),
  }
}
