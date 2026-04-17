"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Settings, Loader2 } from "lucide-react";
import { LENDING } from "@/lib/constants";
import { LoanRepayModal } from "./LoanRepayModal";
import { LoanManageModal } from "./LoanManageModal";

export function ActiveLoans({ loans, loading, onRepay, onManage }) {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayOpen, setRepayOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const interestRate = (LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1);

  const handleRepayClick = (loan) => {
    setSelectedLoan(loan);
    setRepayOpen(true);
  };

  const handleManageClick = (loan) => {
    setSelectedLoan(loan);
    setManageOpen(true);
  };

  const getLoanId = (loan) => loan.index || loan.LoanID;

  return (
    <>
      <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
        <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            My Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/50" />
              <span className="ml-2 text-white/50 font-mono text-xs">Loading loans...</span>
            </div>
          ) : !loans || loans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50 font-mono text-xs">No active loans</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan, i) => {
                const loanId = getLoanId(loan);
                const principal = loan.PrincipalOutstanding || loan.Principal
                  ? (parseInt(loan.PrincipalOutstanding || loan.Principal) / 1_000_000).toFixed(6)
                  : "0.000000";
                const outstanding = loan.TotalValueOutstanding || loan.OutstandingBalance
                  ? (parseInt(loan.TotalValueOutstanding || loan.OutstandingBalance) / 1_000_000).toFixed(6)
                  : principal;

                return (
                  <div
                    key={loanId || i}
                    className="border border-white/10 bg-white/5 p-3 rounded-none"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm font-bold">
                            {principal} XRP
                          </span>
                          <Badge className="rounded-none bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                            ACTIVE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                          <span>Outstanding: {outstanding} XRP</span>
                          <span>Rate: {interestRate}%</span>
                        </div>
                        <p className="text-white/30 font-mono text-xs truncate">
                          {loanId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          onClick={() => handleRepayClick(loan)}
                          className="rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest text-xs"
                        >
                          REPAY
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleManageClick(loan)}
                          className="rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-mono text-xs px-2"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLoan && (
        <>
          <LoanRepayModal
            loan={selectedLoan}
            open={repayOpen}
            onOpenChange={setRepayOpen}
            onRepay={onRepay}
          />
          <LoanManageModal
            loan={selectedLoan}
            open={manageOpen}
            onOpenChange={setManageOpen}
            onManage={onManage}
          />
        </>
      )}
    </>
  );
}
