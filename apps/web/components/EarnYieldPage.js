"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react"
import { useWallet } from "@/components/providers/WalletProvider"
import { useVault } from "@/hooks/useVault"
import { LENDING } from "@/lib/constants"

export function EarnYieldPage() {
  const { isConnected } = useWallet()
  const { deposit, withdraw } = useVault()
  const [vaults, setVaults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVault, setSelectedVault] = useState(null)
  const [action, setAction] = useState(null) // "deposit" | "withdraw"

  const fetchVaults = useCallback(async () => {
    try {
      const res = await fetch("/api/loans/available")
      const data = await res.json()
      setVaults(data.vaults || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    // The initial mount fetch is intentional so the vault list is populated before polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchVaults()
    const interval = setInterval(fetchVaults, 30_000)
    return () => {
      clearInterval(interval)
    }
  }, [fetchVaults])

  const handleAction = (vault, type) => {
    setSelectedVault(vault)
    setAction(type)
  }

  return (
    <>
      <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none max-w-4xl mx-auto">
        <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-white">
              Provide Liquidity — Earn Yield
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vaults.length === 0 && !loading && (
            <div className="p-6 text-center text-white/40 font-mono text-xs">
              No vaults available
            </div>
          )}
          {vaults.map((vault, i) => {
            const liquidity = parseInt(vault.availableLiquidity || "0", 10)
            const totalAssets = parseInt(vault.totalAssets || "0", 10)
            return (
              <div
                key={vault.vaultId || i}
                className="border-b border-white/10 last:border-b-0 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm font-bold">{vault.name}</span>
                      <Badge className="rounded-none bg-white/10 text-white border-white/20 font-mono text-xs">XRP</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                      <span>Rate: {(LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1)}%</span>
                      <span>TVL: {(totalAssets / 1_000_000).toFixed(2)} XRP</span>
                      <span>Available: {(liquidity / 1_000_000).toFixed(2)} XRP</span>
                    </div>
                    <p className="text-white/20 font-mono text-xs truncate">{vault.vaultId}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <Button
                      onClick={() => handleAction(vault, "deposit")}
                      disabled={!isConnected}
                      className="rounded-none bg-white text-black hover:bg-slate-200 font-mono text-xs font-bold tracking-widest"
                    >
                      DEPOSIT
                    </Button>
                    <Button
                      onClick={() => handleAction(vault, "withdraw")}
                      disabled={!isConnected}
                      variant="outline"
                      className="rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs font-bold tracking-widest"
                    >
                      WITHDRAW
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          {!isConnected && (
            <Alert className="rounded-none border-amber-500/50 bg-amber-500/10 text-amber-200 font-mono m-4">
              <Info className="h-4 w-4 text-amber-200" />
              <AlertDescription className="ml-2 text-xs">Connect your wallet to deposit or withdraw.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedVault && action && (
        <VaultActionModal
          vault={selectedVault}
          action={action}
          open={!!selectedVault}
          onOpenChange={(open) => { if (!open) { setSelectedVault(null); setAction(null) } }}
          onDeposit={deposit}
          onWithdraw={withdraw}
          onSuccess={fetchVaults}
        />
      )}
    </>
  )
}

function VaultActionModal({ vault, action, open, onOpenChange, onDeposit, onWithdraw, onSuccess }) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const isDeposit = action === "deposit"
  const amountDrops = Math.floor(parseFloat(amount || "0") * 1_000_000)

  const handleConfirm = async (e) => {
    e.preventDefault()
    if (!amountDrops) return
    setIsSubmitting(true)
    setResult(null)
    try {
      const fn = isDeposit ? onDeposit : onWithdraw
      const res = await fn(vault.vaultId, String(amountDrops))
      setResult({ success: true, hash: res.hash || res.result?.hash })
      onSuccess()
      setTimeout(() => { setAmount(""); setResult(null); onOpenChange(false) }, 1500)
    } catch (err) {
      setResult({ success: false, error: err.message || "Transaction failed" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount(""); setResult(null); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-white/20 bg-black/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{isDeposit ? "DEPOSIT TO VAULT" : "WITHDRAW FROM VAULT"}</DialogTitle>
          <DialogDescription>{vault.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="border border-white/10 p-3 space-y-1 text-xs font-mono text-white/60">
            <div className="flex justify-between">
              <span>Available Liquidity</span>
              <span className="text-white">{(parseInt(vault.availableLiquidity || "0", 10) / 1_000_000).toFixed(2)} XRP</span>
            </div>
            <div className="flex justify-between">
              <span>Total Value Locked</span>
              <span className="text-white">{(parseInt(vault.totalAssets || "0", 10) / 1_000_000).toFixed(2)} XRP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70 font-mono text-xs uppercase">Amount (XRP)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20"
              required
              disabled={isSubmitting}
            />
          </div>

          {!result && (
            <Button
              type="submit"
              disabled={isSubmitting || !amountDrops}
              className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SIGNING...</>
              ) : (
                isDeposit ? "CONFIRM DEPOSIT" : "CONFIRM WITHDRAW"
              )}
            </Button>
          )}

          {result && (
            <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription className="ml-2 text-xs">
                {result.success ? (
                  <p>{isDeposit ? "Deposit" : "Withdrawal"} successful.</p>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
