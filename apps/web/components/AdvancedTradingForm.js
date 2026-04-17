"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { useEscrow } from "@/hooks/useEscrow";
import { WATCHER_ACCOUNT, ADDRESSES } from "@/lib/constants";
import { validateSellOrderDraft } from "@/lib/trading-validators";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Info } from "lucide-react";

function buildCancelAfter() {
  const rippleEpoch = 946684800;
  return Math.floor(Date.now() / 1000) - rippleEpoch + 86400;
}

export function AdvancedTradingForm() {
  const { walletManager, showStatus } = useWallet();
  const { createEscrow } = useEscrow();

  // order form state
  const [pair, setPair] = useState("XRP/USD");
  const [side, setSide] = useState("SELL");
  const [amount, setAmount] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [trailingPct, setTrailingPct] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a crypto-condition preimage + condition hex
  function generateCondition() {
    const preimage = crypto.getRandomValues(new Uint8Array(32));
    // SHA-256 prefix-condition encoding for XRPL
    // We pass raw hex; the watcher will verify via fulfillment
    const preimageHex = Array.from(preimage).map(b => b.toString(16).padStart(2, "0")).join("");
    return { preimageHex, preimage };
  }

  async function hashPreimage(preimage) {
    const digest = await crypto.subtle.digest("SHA-256", preimage);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function getApiErrorMessage(response, fallbackMessage) {
    try {
      const payload = await response.json();
      return payload?.message || payload?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  function buildRegistrationFailureMessage(kind, detail) {
    return `Escrow created successfully, but watcher ${kind} registration failed: ${detail}`
  }

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    try {
      const validatedDraft = validateSellOrderDraft({ type, amount, triggerPrice, trailingPct, tpPrice, slPrice });

      setIsSubmitting(true);

      const { preimageHex, preimage } = generateCondition();
      const conditionHash = await hashPreimage(preimage);

      const conditionHex = "A0258020" + conditionHash + "810120";
      const fulfillmentHex = "A0228020" + preimageHex;

      const cancelAfter = buildCancelAfter();

      const amountInDrops = validatedDraft.amount;

      // Ensure user has USD trustline for SELL orders (to receive USD proceeds)
      if (side === "SELL") {
        await walletManager.signAndSubmit({
          TransactionType: "TrustSet",
          LimitAmount: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER, value: "100000" },
        });
      }

      const result = await createEscrow(
        WATCHER_ACCOUNT,
        amountInDrops,
        conditionHex,
        cancelAfter
      );

      // Register trigger order with watcher
      const typeMap = { SL: "STOP_LOSS", TP: "TAKE_PROFIT", TRAILING: "TRAILING_STOP", OCO: "OCO" };
      const orderPayload = {
        orderType: typeMap[type] || type,
        side,
        amount: amountInDrops,
        escrowSequence: result.sequence,
        owner: walletManager.account.address,
        condition: conditionHex,
        preimage: fulfillmentHex,
        isPrivate,
      };

      if (type === "SL" || type === "TP") {
        orderPayload.triggerPrice = validatedDraft.triggerPrice;
      } else if (type === "TRAILING") {
        orderPayload.trailingPct = validatedDraft.trailingPct;
      } else if (type === "OCO") {
        orderPayload.tpPrice = validatedDraft.tpPrice;
        orderPayload.slPrice = validatedDraft.slPrice;
      }

      if (isPrivate) {
        orderPayload.nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, "0")).join("");
      }

      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!resp.ok) {
        const detail = await getApiErrorMessage(resp, "request rejected")
        throw new Error(
          buildRegistrationFailureMessage("order", detail)
        )
      }
      showStatus(`Successfully created ${type} order on ${isPrivate ? "Groth5 (Private)" : "DevNet"}!`, "success");
      setAmount("");
      setTriggerPrice("");
    } catch (err) {
      showStatus(err.message || "Failed to create order", "error");
    } finally {
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
        <p className="text-xs font-mono text-white/40">
          Current release supports SELL-side advanced orders only. BUY / short flows and scheduled trading remain disabled until their lifecycle is redesigned.
        </p>
        <Tabs defaultValue="sl" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="sl" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">SL</TabsTrigger>
            <TabsTrigger value="tp" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">TP</TabsTrigger>
            <TabsTrigger value="trailing" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">Trailing</TabsTrigger>
            <TabsTrigger value="oco" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">OCO</TabsTrigger>
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
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs">Amount (XRP)</Label>
                  <Input type="number" placeholder="100" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
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

          {/* Trailing Stop */}
          <TabsContent value="trailing">
            <form onSubmit={(e) => handleSubmit(e, "TRAILING")} className="space-y-4">
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
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70 font-mono text-xs">Amount (XRP)</Label>
                <Input type="number" placeholder="100" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70 font-mono text-xs">Trailing Pct (bps)</Label>
                <Input type="number" placeholder="200 (2%)" value={trailingPct} onChange={e => setTrailingPct(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-white/10 mt-4">
                <Checkbox id="zk-trailing" checked={isPrivate} onCheckedChange={setIsPrivate} className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none" />
                <label htmlFor="zk-trailing" className="text-sm font-mono text-white/90 leading-none cursor-pointer flex items-center gap-2">
                  Hide trailing constraint (ZK Proof)
                  <Info className="h-4 w-4 text-white/50" />
                </label>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4">
                {isSubmitting ? "CREATING..." : "CREATE TRAILING STOP"}
              </Button>
            </form>
          </TabsContent>

          {/* OCO */}
          <TabsContent value="oco">
            <form onSubmit={(e) => handleSubmit(e, "OCO")} className="space-y-4">
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
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70 font-mono text-xs">Amount (XRP)</Label>
                <Input type="number" placeholder="100" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs">TP Price (USD)</Label>
                  <Input type="number" step="0.0001" placeholder="0.65" value={tpPrice} onChange={e => setTpPrice(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs">SL Price (USD)</Label>
                  <Input type="number" step="0.0001" placeholder="0.45" value={slPrice} onChange={e => setSlPrice(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-white/10 mt-4">
                <Checkbox id="zk-oco" checked={isPrivate} onCheckedChange={setIsPrivate} className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none" />
                <label htmlFor="zk-oco" className="text-sm font-mono text-white/90 leading-none cursor-pointer flex items-center gap-2">
                  Hide triggers (ZK Proof)
                  <Info className="h-4 w-4 text-white/50" />
                </label>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4">
                {isSubmitting ? "CREATING..." : "CREATE OCO ORDER"}
              </Button>
            </form>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
