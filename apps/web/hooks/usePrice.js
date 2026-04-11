"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { ADDRESSES } from "@/lib/constants"

export function usePrice() {
  const [price, setPrice] = useState(null)
  const [bid, setBid] = useState(null)
  const [ask, setAsk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const clientRef = useRef(null)

  const fetchPrice = useCallback(async () => {
    try {
      const client = await getClient()
      clientRef.current = client

      // Best ask: someone sells USD for XRP (we buy XRP with USD)
      const askResponse = await client.request({
        command: "book_offers",
        taker_pays: { currency: "XRP" },
        taker_gets: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER },
        limit: 1,
      })

      // Best bid: someone buys USD with XRP (we sell XRP for USD)
      const bidResponse = await client.request({
        command: "book_offers",
        taker_pays: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER },
        taker_gets: { currency: "XRP" },
        limit: 1,
      })

      let bestAsk = null
      let bestBid = null

      if (askResponse.result.offers && askResponse.result.offers.length > 0) {
        const offer = askResponse.result.offers[0]
        const pays = typeof offer.TakerPays === "string"
          ? Number(offer.TakerPays) / 1_000_000
          : Number(offer.TakerPays.value)
        const gets = typeof offer.TakerGets === "string"
          ? Number(offer.TakerGets) / 1_000_000
          : Number(offer.TakerGets.value)
        bestAsk = gets / pays // USD per XRP
      }

      if (bidResponse.result.offers && bidResponse.result.offers.length > 0) {
        const offer = bidResponse.result.offers[0]
        const pays = typeof offer.TakerPays === "string"
          ? Number(offer.TakerPays) / 1_000_000
          : Number(offer.TakerPays.value)
        const gets = typeof offer.TakerGets === "string"
          ? Number(offer.TakerGets) / 1_000_000
          : Number(offer.TakerGets.value)
        bestBid = pays / gets // USD per XRP
      }

      setBid(bestBid)
      setAsk(bestAsk)
      setPrice(bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let unsubscribed = false

    const subscribe = async () => {
      try {
        const client = await getClient()
        clientRef.current = client

        await fetchPrice()

        client.on("ledgerClosed", () => {
          if (!unsubscribed) fetchPrice()
        })

        await client.request({ command: "subscribe", streams: ["ledger"] })
      } catch (err) {
        if (!unsubscribed) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    subscribe()

    return () => {
      unsubscribed = true
      if (clientRef.current) {
        clientRef.current.request({ command: "unsubscribe", streams: ["ledger"] }).catch(() => {})
      }
    }
  }, [fetchPrice])

  return { price, bid, ask, loading, error }
}
