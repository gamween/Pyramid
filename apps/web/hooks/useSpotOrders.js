"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useWallet } from "../components/providers/WalletProvider"
import { toOrderRow } from "../lib/order-lifecycle"
import { buildOfferCancelTx, buildSpotOfferCreateTx } from "../lib/spot-order"
import { getClient } from "../lib/xrplClient"

function dropsToXrp(drops) {
  return Number(drops) / 1_000_000
}

function readIssuedValue(amount) {
  return Number(amount?.value ?? 0)
}

function getOrderAmounts(takerGets, takerPays) {
  const isSell = typeof takerGets === "string"
  const baseAmount = isSell ? dropsToXrp(takerGets) : dropsToXrp(takerPays)
  const quoteAmount = isSell ? readIssuedValue(takerPays) : readIssuedValue(takerGets)
  const price = baseAmount > 0 ? quoteAmount / baseAmount : 0

  return {
    side: isSell ? "sell" : "buy",
    baseAmount,
    quoteAmount,
    price,
  }
}

function formatLedgerTime(xrplTime) {
  if (!xrplTime) return "Pending"
  return new Date((xrplTime + 946684800) * 1000).toLocaleString()
}

function normalizeOpenOffer(offer) {
  return toOrderRow({
    sequence: offer.seq,
    ...getOrderAmounts(offer.TakerGets, offer.TakerPays),
    type: "limit",
  })
}

function normalizeHistoryEntry(entry) {
  const tx = entry.tx_json ?? entry.tx ?? {}
  const isOfferCreate = tx.TransactionType === "OfferCreate"
  const amounts =
    isOfferCreate && tx.TakerGets != null && tx.TakerPays != null
      ? getOrderAmounts(tx.TakerGets, tx.TakerPays)
      : {}

  return toOrderRow({
    id: tx.hash ? `native:${tx.hash}` : undefined,
    hash: tx.hash,
    timestamp: formatLedgerTime(tx.date),
    result: entry.meta?.TransactionResult ?? "Pending",
    type: tx.TransactionType ?? "Unknown",
    sequence: tx.Sequence ?? tx.OfferSequence ?? null,
    status: entry.meta?.TransactionResult ?? "Pending",
    ...amounts,
  })
}

export function useSpotOrders() {
  const { walletManager, isConnected } = useWallet()
  const accountAddress = walletManager?.account?.address
  const hasAccount = useMemo(() => Boolean(accountAddress), [accountAddress])

  const [openOrders, setOpenOrders] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [tradeHistory, setTradeHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = useCallback(() => {
    setOpenOrders([])
    setOrderHistory([])
    setTradeHistory([])
    setError("")
  }, [])

  const refresh = useCallback(async () => {
    if (!accountAddress) {
      reset()
      return
    }

    setLoading(true)

    try {
      const client = await getClient()
      const [offersResponse, accountTxResponse] = await Promise.all([
        client.request({
          command: "account_offers",
          account: accountAddress,
          ledger_index: "validated",
        }),
        client.request({
          command: "account_tx",
          account: accountAddress,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 20,
          forward: false,
        }),
      ])

      const transactions = accountTxResponse.result.transactions ?? []
      const offerEntries = transactions.filter((entry) => {
        const tx = entry.tx_json ?? entry.tx ?? {}
        return tx.TransactionType === "OfferCreate" || tx.TransactionType === "OfferCancel"
      })

      setOpenOrders((offersResponse.result.offers ?? []).map(normalizeOpenOffer))
      setOrderHistory(offerEntries.map(normalizeHistoryEntry))
      setTradeHistory([])
      setError("")
    } catch (nextError) {
      reset()
      setError(nextError instanceof Error ? nextError.message : "Unable to load order state")
    } finally {
      setLoading(false)
    }
  }, [accountAddress, reset])

  useEffect(() => {
    if (!isConnected || !accountAddress) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [accountAddress, isConnected, refresh])

  const visibleOpenOrders = isConnected ? openOrders : []
  const visibleOrderHistory = isConnected ? orderHistory : []
  const visibleTradeHistory = isConnected ? tradeHistory : []
  const visibleError = isConnected ? error : ""

  const placeLimitOrder = useCallback(
    async ({ side, baseAmount, limitPrice }) => {
      if (!walletManager || !accountAddress) {
        throw new Error("Wallet not connected")
      }

      const transaction = buildSpotOfferCreateTx({
        account: accountAddress,
        side,
        baseAmount,
        limitPrice,
      })

      const result = await walletManager.signAndSubmit(transaction)
      await refresh()
      return result
    },
    [accountAddress, refresh, walletManager]
  )

  const cancelOrder = useCallback(
    async (offerSequence) => {
      if (!walletManager || !accountAddress) {
        throw new Error("Wallet not connected")
      }

      const transaction = buildOfferCancelTx({
        account: accountAddress,
        offerSequence,
      })

      const result = await walletManager.signAndSubmit(transaction)
      await refresh()
      return result
    },
    [accountAddress, refresh, walletManager]
  )

  return {
    openOrders: visibleOpenOrders,
    orderHistory: visibleOrderHistory,
    tradeHistory: visibleTradeHistory,
    loading,
    error: visibleError,
    refresh,
    placeLimitOrder,
    cancelOrder,
    hasAccount,
  }
}
