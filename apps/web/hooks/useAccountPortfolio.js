"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useWallet } from "../components/providers/WalletProvider"
import { getClient } from "../lib/xrplClient"

function dropsToXrp(drops) {
  return Number(drops) / 1_000_000
}

function formatLedgerTime(xrplTime) {
  if (!xrplTime) return "Pending"
  return new Date((xrplTime + 946684800) * 1000).toLocaleString()
}

export function useAccountPortfolio() {
  const { walletManager, isConnected } = useWallet()
  const accountAddress = walletManager?.account?.address

  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reset = useCallback(() => {
    setSummary(null)
    setAssets([])
    setHistory([])
    setError("")
  }, [])

  const refresh = useCallback(async () => {
    if (!accountAddress) {
      reset()
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const client = await getClient()
      const [accountInfoResponse, accountLinesResponse, accountTxResponse] = await Promise.all([
        client.request({
          command: "account_info",
          account: accountAddress,
          ledger_index: "validated",
        }),
        client.request({
          command: "account_lines",
          account: accountAddress,
          ledger_index: "validated",
        }),
        client.request({
          command: "account_tx",
          account: accountAddress,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 12,
          forward: false,
        }),
      ])

      const accountData = accountInfoResponse.result.account_data
      const trustLines = accountLinesResponse.result.lines ?? []
      const transactions = accountTxResponse.result.transactions ?? []

      setSummary({
        address: accountAddress,
        xrpBalance: dropsToXrp(accountData.Balance),
        ownerCount: accountData.OwnerCount,
        sequence: accountData.Sequence,
        trustLineCount: trustLines.length,
      })

      setAssets([
        {
          symbol: "XRP",
          issuer: "Native asset",
          balance: dropsToXrp(accountData.Balance).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          }),
          limit: "—",
          kind: "native",
        },
        ...trustLines.map((line) => ({
          symbol: line.currency,
          issuer: line.account,
          balance: Number(line.balance).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          }),
          limit: Number(line.limit).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          }),
          kind: "issued",
        })),
      ])

      setHistory(
        transactions.map((entry) => {
          const tx = entry.tx_json ?? entry.tx ?? {}
          return {
            hash: tx.hash,
            type: tx.TransactionType ?? "Unknown",
            result: entry.meta?.TransactionResult ?? "Pending",
            timestamp: formatLedgerTime(tx.date),
          }
        })
      )

      setError("")
    } catch (nextError) {
      reset()
      setError(nextError instanceof Error ? nextError.message : "Unable to read account state")
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

  const visibleSummary = isConnected ? summary : null
  const visibleAssets = isConnected ? assets : []
  const visibleHistory = isConnected ? history : []
  const visibleError = isConnected ? error : ""
  const hasData = useMemo(() => Boolean(visibleSummary), [visibleSummary])

  return {
    summary: visibleSummary,
    assets: visibleAssets,
    history: visibleHistory,
    loading,
    error: visibleError,
    hasData,
    refresh,
  }
}
