"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { ACTIVE_SPOT_MARKET } from "../lib/market-registry"
import { getClient } from "../lib/xrplClient"

function dropsToXrp(drops) {
  return Number(drops) / 1_000_000
}

function readIssuedValue(amount) {
  return Number(amount?.value ?? 0)
}

function formatRow(price, amount, total) {
  return {
    price,
    amount,
    total,
  }
}

function mapAskOffer(offer) {
  const baseAmount = dropsToXrp(offer.TakerGets)
  const quoteAmount = readIssuedValue(offer.TakerPays)
  const price = baseAmount > 0 ? quoteAmount / baseAmount : 0
  return formatRow(price, baseAmount, quoteAmount)
}

function mapBidOffer(offer) {
  const baseAmount = dropsToXrp(offer.TakerPays)
  const quoteAmount = readIssuedValue(offer.TakerGets)
  const price = baseAmount > 0 ? quoteAmount / baseAmount : 0
  return formatRow(price, baseAmount, quoteAmount)
}

export function useSpotMarket() {
  const [marketState, setMarketState] = useState({
    asks: [],
    bids: [],
    samples: [],
    updatedAt: null,
    midPrice: null,
    bestBid: null,
    bestAsk: null,
    spread: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const client = await getClient()

      const [asksResponse, bidsResponse] = await Promise.all([
        client.request({
          command: "book_offers",
          taker_pays: {
            currency: ACTIVE_SPOT_MARKET.quoteCurrency,
            issuer: ACTIVE_SPOT_MARKET.quoteIssuer,
          },
          taker_gets: { currency: "XRP" },
          limit: 10,
        }),
        client.request({
          command: "book_offers",
          taker_pays: { currency: "XRP" },
          taker_gets: {
            currency: ACTIVE_SPOT_MARKET.quoteCurrency,
            issuer: ACTIVE_SPOT_MARKET.quoteIssuer,
          },
          limit: 10,
        }),
      ])

      const asks = (asksResponse.result.offers ?? []).map(mapAskOffer).filter((row) => row.price > 0)
      const bids = (bidsResponse.result.offers ?? []).map(mapBidOffer).filter((row) => row.price > 0)
      const bestAsk = asks[0]?.price ?? null
      const bestBid = bids[0]?.price ?? null
      const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid

      setMarketState((previous) => {
        const nextSample =
          midPrice == null
            ? previous.samples
            : [
                ...previous.samples,
                {
                  timestamp: Date.now(),
                  price: midPrice,
                },
              ].slice(-20)

        return {
          asks,
          bids,
          samples: nextSample,
          updatedAt: Date.now(),
          midPrice,
          bestBid,
          bestAsk,
          spread: bestAsk && bestBid ? bestAsk - bestBid : null,
        }
      })

      setError("")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load market book")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    const interval = setInterval(() => {
      void refresh()
    }, 10000)

    return () => {
      window.clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [refresh])

  const spreadBps = useMemo(() => {
    if (!marketState.spread || !marketState.midPrice) return null
    return (marketState.spread / marketState.midPrice) * 10_000
  }, [marketState.midPrice, marketState.spread])

  return {
    ...marketState,
    spreadBps,
    loading,
    error,
    refresh,
    market: ACTIVE_SPOT_MARKET,
  }
}
