"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function VaultInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [vaultId, setVaultId] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!vaultId || !amount) {
      showStatus("Please provide vault ID and amount", "error");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showStatus("Amount must be a positive number (XRP)", "error");
      return;
    }

    const amountInDrops = String(Math.floor(parsedAmount * 1000000));

    try {
      setIsSubmitting(true);
      setResult(null);

      const transaction = {
        TransactionType: action === "deposit" ? "VaultDeposit" : "VaultWithdraw",
        Account: walletManager.account.address,
        VaultID: vaultId,
        Amount: amountInDrops,
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus(`Vault ${action} successful!`, "success");
      addEvent(`Vault ${action}`, txResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        error: message,
      });
      showStatus(`Vault ${action} failed: ${message}`, "error");
      addEvent(`Vault ${action} Failed`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5">
        <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Vault Interaction</CardTitle>
        <CardDescription className="text-slate-400 font-mono text-xs">Deposit and withdraw from smart vaults</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="vaultId" className="text-white/70 font-mono text-xs">Vault ID</Label>
          <Input
            id="vaultId"
            type="text"
            value={vaultId}
            onChange={(e) => setVaultId(e.target.value)}
            placeholder="Vault ledger ID..."
            className="rounded-none bg-black border-white/30 text-white font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/70 font-mono text-xs">Action</Label>
          <div className="flex gap-2">
            <Button
              className={`rounded-none font-mono text-xs ${action === "deposit" ? "bg-white text-black border border-white hover:bg-slate-200" : "bg-black text-white/50 border border-white/30 hover:bg-white/10 hover:text-white"}`}
              size="sm"
              onClick={() => setAction("deposit")}
            >
              Deposit
            </Button>
            <Button
              className={`rounded-none font-mono text-xs ${action === "withdraw" ? "bg-white text-black border border-white hover:bg-slate-200" : "bg-black text-white/50 border border-white/30 hover:bg-white/10 hover:text-white"}`}
              size="sm"
              onClick={() => setAction("withdraw")}
            >
              Withdraw
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vaultAmount" className="text-white/70 font-mono text-xs">Amount (XRP)</Label>
          <Input
            id="vaultAmount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000000"
            className="rounded-none bg-black border-white/30 text-white font-mono"
          />
        </div>

        <div className="border border-white/20 bg-white/5 p-3 text-sm rounded-none text-white/70 font-mono">
          <p className="font-bold mb-2 text-white">Smart Vault Entry Points</p>
          <ul className="text-white/50 space-y-1 text-xs list-disc pl-4">
            <li>on_deposit() - Called when assets are deposited</li>
            <li>on_withdraw() - Called when assets are withdrawn</li>
          </ul>
        </div>

        {isConnected && (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4">
            {isSubmitting ? "SUBMITTING..." : `${action === "deposit" ? "DEPOSIT" : "WITHDRAW"}`}
          </Button>
        )}

        {!isConnected && (
          <Alert className="rounded-none border-amber-500/50 bg-amber-500/10 text-amber-200 font-mono mt-4">
            <Info className="h-4 w-4 text-amber-200" />
            <AlertDescription className="ml-2 text-xs">Connect your wallet to interact with vaults.</AlertDescription>
          </Alert>
        )}

        {result && (
           <Alert className={`rounded-none mt-4 font-mono ${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertTitle className="ml-2">{result.success ? "TRANSACTION SENT" : "TRANSACTION FAILED"}</AlertTitle>
            <AlertDescription className="ml-2 text-xs mt-2 text-white/70">
              {result.success ? (
                <div className="space-y-1">
                  <p className="break-all font-mono">Hash: {result.hash}</p>
                  {result.id && <p>ID: {result.id}</p>}
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
