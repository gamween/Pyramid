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

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const amountDrops = Math.floor(parseFloat(amount) * 1_000_000);
      const flags = isFullPayment ? LOAN_PAY_FLAGS.tfLoanFullPayment : 0;
      await onRepay(loanId, amountDrops, flags);
      setResult({ success: true });
      setIsSubmitting(false);
    } catch (err) {
      setResult({ success: false, error: err.message || "Repayment failed" });
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
          <div className="space-y-2">
            <Label htmlFor="repayAmount" className="text-white/70 font-mono text-xs uppercase">
              Amount (XRP)
            </Label>
            <Input
              id="repayAmount"
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

          <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
            <Checkbox
              id="fullPayment"
              checked={isFullPayment}
              onCheckedChange={setIsFullPayment}
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
