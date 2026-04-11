"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

export function ZkPrivacy() {
  const { walletManager, isConnected, showStatus } = useWallet();
  
  const [assetPair, setAssetPair] = useState("XRP/USD");
  const [amount, setAmount] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [isProving, setIsProving] = useState(false);
  const [proofResult, setProofResult] = useState(null);

  const handleGenerateProof = async (e) => {
    e.preventDefault();
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }
    if (!amount || !triggerPrice) {
      showStatus("Missing order parameters", "warning");
      return;
    }

    setIsProving(true);
    setProofResult(null);

    try {
      // Mock local RISC0 ZK Proof generation
      showStatus("Initializing WASM prover environment...", "info");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      showStatus("Computing RISC0 zkVM Groth16 proof...", "info");
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setProofResult({
        success: true,
        proofHash: "0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + "..." + Math.random().toString(16).substring(2, 6).toUpperCase(),
        cid: "bafy" + Math.random().toString(36).substring(2, 10),
      });
      showStatus("Smart Escrow with ZK Proof deployed!", "success");
    } catch (err) {
      setProofResult({
        success: false,
        error: err.message || "Failed to generate ZK Proof",
      });
      showStatus("Proof generation failed", "error");
    } finally {
      setIsProving(false);
    }
  };

  return (
    <Card className="border-none bg-black/60 backdrop-blur-md rounded-none h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col justify-center">
        {!proofResult && !isProving ? (
          <form onSubmit={handleGenerateProof} className="space-y-4 text-left">
            <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400">Private Escrow Config</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zkPair" className="text-white/70 font-mono text-xs uppercase">Pair</Label>
                <Input
                  id="zkPair"
                  type="text"
                  value={assetPair}
                  onChange={(e) => setAssetPair(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zkAmount" className="text-white/70 font-mono text-xs uppercase">Size</Label>
                <Input
                  id="zkAmount"
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="zkPrice" className="text-white/70 font-mono text-xs uppercase flex items-center justify-between">
                <span>Secret Trigger Price</span>
                <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1">HIDDEN ON-CHAIN</span>
              </Label>
              <Input
                id="zkPrice"
                type="password"
                placeholder="Enter secret limit price..."
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs"
                required
              />
            </div>

            <div className="border border-white/10 bg-white/5 p-3 text-xs rounded-none text-white/50 font-mono mt-4 leading-relaxed">
              <p>Your trigger price will be hashed and verified via <strong>Groth5</strong>. The contract only sees the Zero-Knowledge proof, never the raw price.</p>
            </div>

            <Button 
              type="submit" 
              disabled={isProving || !isConnected} 
              className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4 tracking-widest transition-colors"
            >
              {isConnected ? "GENERATE RISC0 PROOF" : "WALLET DISCONNECTED"}
            </Button>
          </form>
        ) : isProving ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
            <div className="text-center font-mono space-y-2">
              <p className="text-white font-bold uppercase tracking-widest">Generating Proof</p>
              <p className="text-xs text-white/50 animate-pulse">Running RISC0 Guest Program...</p>
            </div>
            <div className="w-full bg-white/10 h-1">
              <div className="bg-white h-1 w-1/2 animate-[indeterminate_2s_infinite_linear]"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-4 animate-in fade-in">
            <div className="h-16 w-16 border border-green-500 bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-green-500 font-mono font-bold uppercase tracking-widest">ZK Proof Deployed</h3>
            
            <div className="w-full space-y-2 mt-4 text-left bg-black border border-white/20 p-4">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Proof Hash</p>
              <p className="text-xs text-green-400 font-mono break-all">{proofResult.proofHash}</p>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] text-slate-400 font-mono uppercase">IPFS CID Payload</p>
                <p className="text-xs text-white font-mono break-all">{proofResult.cid}</p>
              </div>
            </div>
            
            <Button 
              onClick={() => { setProofResult(null); setAmount(""); setTriggerPrice(""); }}
              className="w-full rounded-none border border-white bg-transparent text-white hover:bg-white hover:text-black font-mono font-bold tracking-widest mt-4"
            >
              NEW PRIVATE ORDER
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
