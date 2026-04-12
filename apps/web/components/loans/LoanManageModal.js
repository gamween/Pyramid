"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { LOAN_MANAGE_FLAGS } from "@/lib/constants";

export function LoanManageModal({ loan, open, onOpenChange, onManage }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [result, setResult] = useState(null);

  const loanId = loan?.index || loan?.LoanID;

  const handleAction = async (flag, actionName) => {
    setIsSubmitting(true);
    setActiveAction(actionName);
    setResult(null);

    try {
      await onManage(loanId, flag);
      setResult({ success: true, action: actionName });
      setIsSubmitting(false);
      setActiveAction(null);
    } catch (err) {
      setResult({ success: false, error: err.message || "Manage action failed" });
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setResult(null);
      setIsSubmitting(false);
      setActiveAction(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-black border-white/20 rounded-none">
        <DialogHeader className="border-b border-white/20 pb-3">
          <DialogTitle className="text-sm font-mono uppercase tracking-widest text-white">
            Manage Loan
          </DialogTitle>
          <DialogDescription className="text-white/60 font-mono text-xs">
            Loan ID: {loanId ? `${loanId.slice(0, 8)}...${loanId.slice(-8)}` : "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => handleAction(LOAN_MANAGE_FLAGS.tfLoanDefault, "DEFAULT")}
              disabled={isSubmitting}
              className="w-full rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs"
            >
              {isSubmitting && activeAction === "DEFAULT" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                "DEFAULT"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction(LOAN_MANAGE_FLAGS.tfLoanImpair, "IMPAIR")}
              disabled={isSubmitting}
              className="w-full rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs"
            >
              {isSubmitting && activeAction === "IMPAIR" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                "IMPAIR"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction(LOAN_MANAGE_FLAGS.tfLoanUnimpair, "UNIMPAIR")}
              disabled={isSubmitting}
              className="w-full rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs"
            >
              {isSubmitting && activeAction === "UNIMPAIR" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                "UNIMPAIR"
              )}
            </Button>
          </div>

          {result && (
            <Alert className={`rounded-none font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="ml-2 text-xs">
                {result.success ? `${result.action} action submitted successfully.` : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
