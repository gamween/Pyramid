"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { LENDING } from "@/lib/constants";

export function LoanBorrowModal({ vault, open, onOpenChange, onBorrow }) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const interestRate = (LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1);
  const gracePeriodDays = LENDING.DEFAULT_GRACE_PERIOD / 86400;
  const paymentIntervalDays = LENDING.DEFAULT_PAYMENT_INTERVAL / 86400;
  const payments = 12;

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const amountDrops = Math.floor(parseFloat(amount) * 1_000_000);
      await onBorrow(vault.vaultId, amountDrops);
      setResult({ success: true });
      setIsSubmitting(false);
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (err) {
      const msg = err.message || "Borrow request failed";
      let friendly = msg;
      if (msg.includes("Insufficient liquidity")) friendly = msg;
      else if (msg.includes("telINSUF_FEE")) friendly = "Network fee too high, try again in a moment.";
      setResult({ success: false, error: friendly });
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setAmount("");
      setResult(null);
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-black border-white/20 rounded-none">
        <DialogHeader className="border-b border-white/20 pb-3">
          <DialogTitle className="text-sm font-mono uppercase tracking-widest text-white">
            Borrow from Vault
          </DialogTitle>
          <DialogDescription className="text-white/60 font-mono text-xs">
            {vault?.name || "Vault"} — Request a loan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="borrowAmount" className="text-white/70 font-mono text-xs uppercase">
              Amount (XRP)
            </Label>
            <Input
              id="borrowAmount"
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="border border-white/20 bg-white/5 p-3 text-sm rounded-none font-mono">
            <p className="font-bold mb-2 text-white text-xs uppercase tracking-widest">Loan Terms</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Interest Rate</span>
                <span className="text-white">{interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Payments</span>
                <span className="text-white">{payments} monthly (~{paymentIntervalDays} days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Grace Period</span>
                <span className="text-white">{gracePeriodDays} days</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1.5">
                <span className="text-white/50">Principal</span>
                <span className="text-white font-bold">{amount ? parseFloat(amount).toFixed(6) : "0.000000"} XRP</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                PROCESSING...
              </span>
            ) : (
              "CONFIRM BORROW"
            )}
          </Button>

          {result && (
            <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="ml-2 text-xs">
                {result.success ? "Borrow request submitted successfully." : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
