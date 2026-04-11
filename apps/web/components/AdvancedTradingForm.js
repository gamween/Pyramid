"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Info } from "lucide-react";

export function AdvancedTradingForm() {
  const { walletManager, isConnected, showStatus } = useWallet();
  
  // order form state
  const [pair, setPair] = useState("XRP/USD");
  const [side, setSide] = useState("SELL");
  const [amount, setAmount] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [trailingPct, setTrailingPct] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  
  // DCA/TWAP state
  const [amountPerBuy, setAmountPerBuy] = useState("");
  const [numBuys, setNumBuys] = useState("");
  const [ticketInterval, setTicketInterval] = useState("");

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Mock submission for now since we just build the UI
      setTimeout(() => {
        showStatus(`Successfully created ${type} order on ${isPrivate ? "Groth5 (Private)" : "DevNet"}!`, "success");
        setIsSubmitting(false);
        setAmount("");
        setTriggerPrice("");
      }, 1000);
    } catch (err) {
      showStatus(err.message || "Failed to create order", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5">
        <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Create Order</CardTitle>
        <CardDescription className="text-slate-400 font-mono text-xs">
          Advanced Trading via Escrows & DEX
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="sl" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="sl" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">SL</TabsTrigger>
            <TabsTrigger value="tp" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">TP</TabsTrigger>
            <TabsTrigger value="trailing" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">Trailing</TabsTrigger>
            <TabsTrigger value="oco" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">OCO</TabsTrigger>
            <TabsTrigger value="dca" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">DCA</TabsTrigger>
            <TabsTrigger value="twap" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">TWAP</TabsTrigger>
          </TabsList>

          {/* SL / TP Content */}
          {["sl", "tp"].map((tabInfo) => (
            <TabsContent key={tabInfo} value={tabInfo}>
              <form onSubmit={(e) => handleSubmit(e, tabInfo.toUpperCase())} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70 font-mono text-xs">Asset Pair</Label>
                    <Input value={pair} onChange={e => setPair(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 font-mono text-xs">Side</Label>
                    <select 
                      value={side} onChange={e => setSide(e.target.value)} 
                      className="flex h-10 w-full border border-white/30 bg-black px-3 py-2 text-sm font-mono text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-none"
                    >
                      <option value="SELL">SELL (Long)</option>
                      <option value="BUY">BUY (Short)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs">Amount (XRP drops)</Label>
                  <Input type="number" placeholder="500000000" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs">Trigger Price (USD)</Label>
                  <Input type="number" step="0.0001" placeholder="0.55" value={triggerPrice} onChange={e => setTriggerPrice(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                </div>
                
                {/* ZK Toggle */}
                <div className="flex items-center space-x-2 pt-2 border-t border-white/10 mt-4">
                  <Checkbox id={`zk-${tabInfo}`} checked={isPrivate} onCheckedChange={setIsPrivate} className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none" />
                  <label htmlFor={`zk-${tabInfo}`} className="text-sm font-mono text-white/90 leading-none cursor-pointer flex items-center gap-2">
                    Hide trigger price (ZK Proof)
                    <Info className="h-4 w-4 text-white/50" />
                  </label>
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4">
                  {isSubmitting ? "CREATING..." : `CREATE ${tabInfo.toUpperCase()} ORDER`}
                </Button>
              </form>
            </TabsContent>
          ))}
          
        </Tabs>
      </CardContent>
    </Card>
  );
}
