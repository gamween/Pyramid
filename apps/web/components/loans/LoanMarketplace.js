"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vault, Info, Loader2 } from "lucide-react";
import { useWallet } from "@/components/providers/WalletProvider";
import { LENDING } from "@/lib/constants";
import { LoanBorrowModal } from "./LoanBorrowModal";

export function LoanMarketplace({ vaults, loading, onBorrow }) {
  const { isConnected } = useWallet();
  const [selectedVault, setSelectedVault] = useState(null);
  const [borrowOpen, setBorrowOpen] = useState(false);

  const interestRate = (LENDING.DEFAULT_INTEREST_RATE / 100).toFixed(1);

  const handleBorrowClick = (vault) => {
    setSelectedVault(vault);
    setBorrowOpen(true);
  };

  return (
    <>
      <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
        <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <Vault className="h-4 w-4" />
            Available Vaults
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/50" />
              <span className="ml-2 text-white/50 font-mono text-xs">Loading vaults...</span>
            </div>
          ) : !isConnected ? (
            <Alert className="rounded-none border-amber-500/50 bg-amber-500/10 text-amber-200 font-mono">
              <Info className="h-4 w-4 text-amber-200" />
              <AlertDescription className="ml-2 text-xs">
                Connect your wallet to borrow
              </AlertDescription>
            </Alert>
          ) : !vaults || vaults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50 font-mono text-xs">No vaults available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaults.map((vault, i) => (
                <div
                  key={vault.vaultId || vault.id || i}
                  className="border border-white/10 bg-white/5 p-3 rounded-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm font-bold">
                          {vault.name || "Vault"}
                        </span>
                        <Badge className="rounded-none bg-white/10 text-white border-white/20 font-mono text-xs">
                          XRP
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                        <span>Rate: {interestRate}%</span>
                        {vault.availableLiquidity && (
                          <span>Liquidity: {(parseInt(vault.availableLiquidity, 10) / 1_000_000).toFixed(2)} XRP</span>
                        )}
                      </div>
                      <p className="text-white/30 font-mono text-xs truncate">
                        {vault.vaultId || vault.id}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleBorrowClick(vault)}
                      className="rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold tracking-widest text-xs ml-3"
                    >
                      BORROW
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVault && (
        <LoanBorrowModal
          vault={selectedVault}
          open={borrowOpen}
          onOpenChange={setBorrowOpen}
          onBorrow={onBorrow}
        />
      )}
    </>
  );
}
