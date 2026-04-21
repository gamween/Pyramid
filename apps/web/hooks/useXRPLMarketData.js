"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { ACTIVE_SPOT_MARKET } from "../lib/market-registry.js"
import {
  DEFAULT_TIMEFRAME,
  buildSeededChartState,
  fetchXRPLMarketFeed,
} from "../lib/market-data/xrpl-market-feed.js"

export function useXRPLMarketData(market = ACTIVE_SPOT_MARKET) {
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME)
  const [marketState, setMarketState] = useState({
    market,
    asks: [],
    bids: [],
    bestAsk: null,
    bestBid: null,
    midPrice: null,
    spread: null,
    updatedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const nextState = await fetchXRPLMarketFeed({ market })
      setMarketState(nextState)
      setError("")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load XRPL market data")
    } finally {
      setLoading(false)
    }
  }, [market])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    const intervalId = window.setInterval(() => {
      void refresh()
    }, 10_000)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [refresh])

  const { candles, timeframeLocked, seedNote } = useMemo(
    () => buildSeededChartState({ timeframe }),
    [timeframe]
  )
  const spreadBps = useMemo(() => {
    if (!marketState.spread || !marketState.midPrice) return null
    return (marketState.spread / marketState.midPrice) * 10_000
  }, [marketState.midPrice, marketState.spread])

  return {
    ...marketState,
    candles,
    timeframe,
    setTimeframe,
    timeframeLocked,
    seedNote,
    spreadBps,
    loading,
    error,
    refresh,
  }
}
