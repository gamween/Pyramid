"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { useLoan } from "../hooks/useLoan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function LoanInteraction() {
  const { walletManager, isConnected, showStatus } = useWallet();
  const { createLoan, payLoan, isLoading } = useLoan();
  
  // Borrow state
  const [loanBrokerId, setLoanBrokerId] = useState("");
  const [principal, setPrincipal] = useState("");
  
  // Repay state
  const [loanId, setLoanId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [isFullRepay, setIsFullRepay] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e, action) => {
    e.preventDefault();
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);

    try {
      let response;
      if (action === "BORROW") {
        response = await createLoan(loanBrokerId, principal);
      } else {
        response = await payLoan(loanId, repayAmount, isFullRepay);
      }
      
      setResult({
        success: true,
        hash: response.result?.hash || response.hash || response.tx_json?.hash || "submitted (hash unavailable)",
        action: action
      });
      setIsSubmitting(false);
    } catch (err) {
      setResult({
        success: false,
        error: err.message || "Failed to process loan action",
      });
      showStatus("Loan action failed", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
        <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Loan Broker</CardTitle>
        <CardDescription className="text-slate-400 font-mono text-xs">
          Borrow and repay loans (XLS-66)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="borrow" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="borrow" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">BORROW</TabsTrigger>
            <TabsTrigger value="repay" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">REPAY</TabsTrigger>
          </TabsList>

          {/* BORROW TAB */}
          <TabsContent value="borrow">
            <form onSubmit={(e) => handleSubmit(e, "BORROW")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loanBrokerId" className="text-white/70 font-mono text-xs uppercase">Loan Broker ID</Label>
                <Input
                  id="loanBrokerId"
                  type="text"
                  placeholder="Ledger ID..."
                  value={loanBrokerId}
                  onChange={(e) => setLoanBrokerId(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal" className="text-white/70 font-mono text-xs uppercase">Principal Amount (drops)</Label>
                <Input
                  id="principal"
                  type="number"
                  placeholder="e.g., 500000000"
                  min="1"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
                  required
                />
              </div>

              <div className="border border-white/20 bg-white/5 p-3 text-sm rounded-none text-white/70 font-mono mt-4">
                <p className="font-bold mb-2 text-white">Borrower's Note</p>
                <ul className="text-white/50 space-y-1 text-xs list-disc pl-4">
                  <li>Cosignment required for LoanSet</li>
                  <li>Default interest rate applies (0.5% annualized)</li>
                </ul>
              </div>

              {isConnected && (
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4 tracking-widest">
                  {isSubmitting ? "PROCESSING..." : "REQUEST LOAN"}
                </Button>
              )}
            </form>
          </TabsContent>

          {/* REPAY TAB */}
          <TabsContent value="repay">
            <form onSubmit={(e) => handleSubmit(e, "REPAY")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loanId" className="text-white/70 font-mono text-xs uppercase">Loan ID</Label>
                <Input
                  id="loanId"
                  type="text"
                  placeholder="Ledger ID of the loan..."
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repayAmount" className="text-white/70 font-mono text-xs uppercase">Repayment Amount (drops)</Label>
                <Input
                  id="repayAmount"
                  type="number"
                  placeholder="e.g., 1000000"
                  min="0"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-white/10 mt-4">
                <Checkbox id="fullRepay" checked={isFullRepay} onCheckedChange={setIsFullRepay} className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none" />
                <label htmlFor="fullRepay" className="text-sm font-mono text-white/90 leading-none cursor-pointer flex items-center gap-2">
                  Full Repayment (tfLoanFullPayment)
                </label>
              </div>

              {isConnected && (
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4 tracking-widest">
                  {isSubmitting ? "PROCESSING..." : "REPAY LOAN"}
                </Button>
              )}
            </form>
          </TabsContent>
          
          {!isConnected && (
            <Alert className="rounded-none border-amber-500/50 bg-amber-500/10 text-amber-200 font-mono mt-4">
              <Info className="h-4 w-4 text-amber-200" />
              <AlertDescription className="ml-2 text-xs">Connect your wallet to interact with loans.</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={`rounded-none mt-4 font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertTitle className="ml-2">{result.success ? `${result.action} INITIATED` : "ACTION FAILED"}</AlertTitle>
              <AlertDescription className="ml-2 text-xs mt-2 text-white/70">
                {result.success ? (
                  <div className="space-y-1">
                    <p className="font-mono break-all text-xs">Hash: {result.hash}</p>
                  </div>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
