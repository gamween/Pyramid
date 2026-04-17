"use client"

import { useCallback, useState, useEffect } from "react"
import { useWallet } from "@/components/providers/WalletProvider"

/**
 * useLoanMarket — browser-side hook for all loan marketplace operations.
 *
 * Provides:
 *  - availableVaults / activeLoans  (auto-polled every 30 s)
 *  - borrowFromVault   (server-side borrow flow)
 *  - repayLoan         (single-signer cosign flow)
 *  - manageLoan        (single-signer cosign flow)
 */
export function useLoanMarket() {
  const { walletManager, isConnected } = useWallet()

  const [availableVaults, setAvailableVaults] = useState([])
  const [activeLoans, setActiveLoans] = useState([])
  const [borrowerAddress, setBorrowerAddress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Read helpers ────────────────────────────────────────────────

  const fetchAvailableVaults = useCallback(async () => {
    try {
      const res = await fetch("/api/loans/available")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch vaults")
      setAvailableVaults(data.vaults || [])
      if (data.borrowerAddress) setBorrowerAddress(data.borrowerAddress)
      return data.vaults || []
    } catch (err) {
      console.error("[useLoanMarket] fetchAvailableVaults:", err)
      return []
    }
  }, [])

  const fetchActiveLoans = useCallback(async () => {
    // Query by server-managed borrower address (browser wallets can't sign XLS-66)
    const address = borrowerAddress || walletManager?.account?.address
    if (!address) return []
    try {
      const res = await fetch(`/api/loans/status?account=${address}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch loans")
      setActiveLoans(data.loans || [])
      return data.loans || []
    } catch (err) {
      console.error("[useLoanMarket] fetchActiveLoans:", err)
      return []
    }
  }, [borrowerAddress, walletManager])

  // ── Polling ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchAvailableVaults()
    fetchActiveLoans()

    const interval = setInterval(() => {
      fetchAvailableVaults()
      fetchActiveLoans()
    }, 30_000)

    return () => clearInterval(interval)
  }, [fetchAvailableVaults, fetchActiveLoans, isConnected])

  // ── Write helpers ───────────────────────────────────────────────

  /**
   * borrowFromVault — server-side cosign flow:
   *  POST /api/loans/borrow → watcher bot signs both broker + borrower, submits.
   *  Browser wallets can't sign XLS-66 types (LoanSet), so the watcher handles
   *  both signatures using server-managed keys.
   */
  const borrowFromVault = useCallback(async (vaultId, principalDrops, opts = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/loans/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultId,
          principalDrops: String(principalDrops),
          ...opts,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Borrow failed")

      await fetchActiveLoans()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchActiveLoans])

  /**
   * repayLoan — server-side (LoanPay is XLS-66, wallet can't sign).
   */
  const repayLoan = useCallback(async (loanId, amountDrops, flags = 0) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/loans/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, amountDrops: String(amountDrops), flags }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Repay failed")
      await fetchActiveLoans()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchActiveLoans])

  /**
   * manageLoan — server-side (LoanManage is XLS-66).
   */
  const manageLoan = useCallback(async (loanId, flags) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/loans/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, flags }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Manage failed")
      await fetchActiveLoans()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchActiveLoans])

  return {
    availableVaults,
    activeLoans,
    loading,
    error,
    fetchAvailableVaults,
    fetchActiveLoans,
    borrowFromVault,
    repayLoan,
    manageLoan,
  }
}
