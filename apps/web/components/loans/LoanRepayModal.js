"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { LOAN_PAY_FLAGS } from "@/lib/constants";

export function LoanRepayModal({ loan, open, onOpenChange, onRepay }) {
  const [amount, setAmount] = useState("");
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loanId = loan?.index || loan?.LoanID;

  // Parse loan payment info
  const periodicPaymentDrops = parseFloat(loan?.PeriodicPayment || "0");
  const periodicPaymentXRP = periodicPaymentDrops / 1_000_000;
  const totalOwedDrops = parseInt(loan?.TotalValueOutstanding || "0", 10);
  const totalOwedXRP = totalOwedDrops / 1_000_000;

  const handleConfirm = async () => {
    const payXRP = parseFloat(amount);
    if (!payXRP || payXRP <= 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const amountDrops = Math.floor(payXRP * 1_000_000);
      // Use tfLoanOverpayment if paying more than periodic but not full
      let flags = 0;
      if (isFullPayment) {
        flags = LOAN_PAY_FLAGS.tfLoanFullPayment;
      } else if (amountDrops > Math.ceil(periodicPaymentDrops)) {
        flags = LOAN_PAY_FLAGS.tfLoanOverpayment;
      }
      await onRepay(loanId, amountDrops, flags);
      setResult({ success: true });
      setIsSubmitting(false);
      // Auto-close modal after success
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (err) {
      const msg = err.message || "Repayment failed";
      // Map XRPL error codes to friendly messages
      let friendly = msg;
      if (msg.includes("tecKILLED")) friendly = "Loan already closed or fully repaid.";
      else if (msg.includes("tecINSUFFICIENT_PAYMENT")) friendly = `Payment too low. Minimum is ${periodicPaymentXRP.toFixed(6)} XRP per period.`;
      else if (msg.includes("telINSUF_FEE")) friendly = "Network fee too high, try again in a moment.";
      else if (msg.includes("tecINSUFFICIENT_FUNDS")) friendly = "Borrower account has insufficient XRP balance.";
      setResult({ success: false, error: friendly });
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setAmount("");
      setIsFullPayment(false);
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
            Repay Loan
          </DialogTitle>
          <DialogDescription className="text-white/60 font-mono text-xs">
            Loan ID: {loanId ? `${loanId.slice(0, 8)}...${loanId.slice(-8)}` : "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Loan summary */}
          <div className="border border-white/10 p-3 space-y-1 text-xs font-mono text-white/60">
            <div className="flex justify-between">
              <span>Min Payment</span>
              <span className="text-white">{periodicPaymentXRP.toFixed(6)} XRP</span>
            </div>
            <div className="flex justify-between">
              <span>Total Owed</span>
              <span className="text-white">{totalOwedXRP.toFixed(6)} XRP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repayAmount" className="text-white/70 font-mono text-xs uppercase">
              Amount (XRP)
            </Label>
            <Input
              id="repayAmount"
              type="number"
              step="0.000001"
              min={periodicPaymentXRP > 0 ? periodicPaymentXRP.toFixed(6) : "0"}
              placeholder={periodicPaymentXRP > 0 ? periodicPaymentXRP.toFixed(6) : "0.000000"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
            <Checkbox
              id="fullPayment"
              checked={isFullPayment}
              onCheckedChange={(checked) => {
                setIsFullPayment(checked);
                if (checked && totalOwedXRP > 0) setAmount(totalOwedXRP.toFixed(6));
              }}
              className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none"
            />
            <label htmlFor="fullPayment" className="text-sm font-mono text-white/90 leading-none cursor-pointer">
              Full payment (close loan)
            </label>
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
              "CONFIRM REPAYMENT"
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
                {result.success ? "Repayment submitted successfully." : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
