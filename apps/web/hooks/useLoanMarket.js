"use client"

import { useCallback, useState, useEffect } from "react"
import { useWallet } from "@/components/providers/WalletProvider"

/**
 * Helper: sign a transaction via xrpl-connect's walletManager,
 * falling back to the raw adapter when the wallet SDK doesn't
 * recognise a native XLS-66 transaction type.
 */
async function signWithWallet(walletManager, tx) {
  try {
    const result = await walletManager.sign(tx)
    return result
  } catch (err) {
    const msg = err.message || ""
    // If the error is NOT about an unknown / invalid TransactionType, re-throw
    if (!msg.includes("valid") && !msg.includes("TransactionType") && !msg.includes("Unknown")) {
      throw err
    }
    // Fallback: access the underlying adapter directly
    const adapter = walletManager._adapter || walletManager.adapter
    if (adapter && typeof adapter.sign === "function") {
      return await adapter.sign(tx)
    }
    throw new Error(`Wallet adapter does not support signing ${tx.TransactionType}. ${msg}`)
  }
}

/**
 * useLoanMarket — browser-side hook for all loan marketplace operations.
 *
 * Provides:
 *  - availableVaults / activeLoans  (auto-polled every 30 s)
 *  - borrowFromVault   (two-phase cosign flow)
 *  - repayLoan         (single-signer cosign flow)
 *  - manageLoan        (single-signer cosign flow)
 *  - closeLoan         (single-signer cosign flow)
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
   * repayLoan — single-signer cosign flow:
   *  Build LoanPay tx → sign → POST cosign with singleSigner flag
   */
  const repayLoan = useCallback(async (loanId, amountDrops, flags = 0) => {
    if (!walletManager) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanPay",
        Account: walletManager.account.address,
        LoanID: loanId,
        Amount: String(amountDrops),
        Flags: flags,
      }
      const signResult = await signWithWallet(walletManager, tx)

      const cosignRes = await fetch("/api/loans/cosign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_blob: signResult.tx_blob,
          singleSigner: true,
        }),
      })
      const cosignData = await cosignRes.json()
      if (!cosignRes.ok) throw new Error(cosignData.error || "Repay cosign failed")

      await fetchActiveLoans()
      return cosignData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  /**
   * manageLoan — single-signer cosign flow:
   *  Build LoanManage tx → sign → POST cosign with singleSigner flag
   */
  const manageLoan = useCallback(async (loanId, flags) => {
    if (!walletManager) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanManage",
        Account: walletManager.account.address,
        LoanID: loanId,
        Flags: flags,
      }
      const signResult = await signWithWallet(walletManager, tx)

      const cosignRes = await fetch("/api/loans/cosign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_blob: signResult.tx_blob,
          singleSigner: true,
        }),
      })
      const cosignData = await cosignRes.json()
      if (!cosignRes.ok) throw new Error(cosignData.error || "Manage cosign failed")

      await fetchActiveLoans()
      return cosignData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

  /**
   * closeLoan — single-signer cosign flow:
   *  Build LoanDelete tx → sign → POST cosign with singleSigner flag
   */
  const closeLoan = useCallback(async (loanId) => {
    if (!walletManager) throw new Error("Wallet not connected")
    setLoading(true)
    setError(null)
    try {
      const tx = {
        TransactionType: "LoanDelete",
        Account: walletManager.account.address,
        LoanID: loanId,
      }
      const signResult = await signWithWallet(walletManager, tx)

      const cosignRes = await fetch("/api/loans/cosign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_blob: signResult.tx_blob,
          singleSigner: true,
        }),
      })
      const cosignData = await cosignRes.json()
      if (!cosignRes.ok) throw new Error(cosignData.error || "Close cosign failed")

      await fetchActiveLoans()
      return cosignData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletManager, fetchActiveLoans])

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
    closeLoan,
  }
}
