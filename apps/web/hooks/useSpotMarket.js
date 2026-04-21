"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { fetchXRPLMarketFeed } from "../lib/market-data/xrpl-market-feed"
import { ACTIVE_SPOT_MARKET } from "../lib/market-registry"

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
      const nextMarketState = await fetchXRPLMarketFeed({
        market: ACTIVE_SPOT_MARKET,
        limit: 10,
      })

      setMarketState((previous) => {
        const nextSample =
          nextMarketState.midPrice == null
            ? previous.samples
            : [
                ...previous.samples,
                {
                  timestamp: Date.now(),
                  price: nextMarketState.midPrice,
                },
              ].slice(-20)

        return {
          ...nextMarketState,
          samples: nextSample,
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
