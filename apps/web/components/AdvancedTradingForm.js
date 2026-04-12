"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { useEscrow } from "@/hooks/useEscrow";
import { WATCHER_ACCOUNT, ADDRESSES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Info } from "lucide-react";

export function AdvancedTradingForm() {
  const { walletManager, isConnected, showStatus } = useWallet();
  const { createEscrow } = useEscrow();

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

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const { preimageHex, preimage } = generateCondition();
      const conditionHash = await hashPreimage(preimage);

      const conditionHex = "A0258020" + conditionHash + "810120";
      const fulfillmentHex = "A0228020" + preimageHex;

      const rippleEpoch = 946684800;
      const cancelAfter = Math.floor(Date.now() / 1000) - rippleEpoch + 86400;

      // ── DCA / TWAP: one escrow for total, watcher splits into N trades ──
      const isDca = type === "DCA" || type === "TWAP";
      let amountInDrops;
      let slices, perSliceDrops, intervalMs;

      if (isDca) {
        const count = parseInt(numBuys);
        const intervalSec = parseInt(ticketInterval);
        if (!count || count < 1 || !intervalSec || intervalSec < 1) {
          showStatus("Enter valid # slices and interval", "error");
          return;
        }

        // Ensure user has USD trustline to receive proceeds from SELL trades
        if (side === "SELL") {
          showStatus("Setting up USD trustline...", "info");
          await walletManager.signAndSubmit({
            TransactionType: "TrustSet",
            LimitAmount: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER, value: "100000" },
          });
        }

        let totalXrp;
        if (type === "DCA") {
          const perBuy = parseFloat(amountPerBuy);
          totalXrp = perBuy * count;
          perSliceDrops = String(Math.floor(perBuy * 1000000));
        } else {
          totalXrp = parseFloat(amount);
          perSliceDrops = String(Math.floor((totalXrp / count) * 1000000));
        }
        amountInDrops = String(Math.floor(totalXrp * 1000000));
        slices = count;
        intervalMs = intervalSec * 1000;
      } else {
        amountInDrops = String(Math.floor(parseFloat(amount) * 1000000));

        // Ensure user has USD trustline for SELL orders (to receive USD proceeds)
        if (side === "SELL") {
          await walletManager.signAndSubmit({
            TransactionType: "TrustSet",
            LimitAmount: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER, value: "100000" },
          });
        }
      }

      const result = await createEscrow(
        WATCHER_ACCOUNT,
        amountInDrops,
        conditionHex,
        cancelAfter
      );

      if (isDca) {
        // Register DCA/TWAP schedule with watcher
        const resp = await fetch("http://localhost:3001/api/dca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: walletManager.account.address,
            escrowSequence: result.sequence,
            condition: conditionHex,
            preimage: fulfillmentHex,
            side,
            totalAmount: amountInDrops,
            perSliceAmount: perSliceDrops,
            slices,
            intervalMs,
          }),
        });
        if (!resp.ok) throw new Error("Watcher registration failed");
        showStatus(`${type} scheduled: ${slices} trades every ${intervalMs / 1000}s`, "success");
        setAmountPerBuy("");
        setAmount("");
        setNumBuys("");
        setTicketInterval("");
      } else {
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
          orderPayload.triggerPrice = parseFloat(triggerPrice);
        } else if (type === "TRAILING") {
          orderPayload.trailingPct = parseInt(trailingPct, 10);
        } else if (type === "OCO") {
          orderPayload.tpPrice = parseFloat(tpPrice);
          orderPayload.slPrice = parseFloat(slPrice);
        }

        if (isPrivate) {
          orderPayload.nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, "0")).join("");
        }

        const resp = await fetch("http://localhost:3001/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        if (!resp.ok) throw new Error("Watcher registration failed — escrow created but order not tracked");
        showStatus(`Successfully created ${type} order on ${isPrivate ? "Groth5 (Private)" : "DevNet"}!`, "success");
        setAmount("");
        setTriggerPrice("");
      }
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
        <Tabs defaultValue="sl" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="sl" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">SL</TabsTrigger>
            <TabsTrigger value="tp" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">TP</TabsTrigger>
            <TabsTrigger value="trailing" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">Trailing</TabsTrigger>
            <TabsTrigger value="oco" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">OCO</TabsTrigger>
            <TabsTrigger value="dca" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">DCA</TabsTrigger>
            <TabsTrigger value="twap" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">TWAP</TabsTrigger>
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
                    <option value="SELL">SELL (Long)</option>
                    <option value="BUY">BUY (Short)</option>
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
                    <option value="SELL">SELL (Long)</option>
                    <option value="BUY">BUY (Short)</option>
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

          {/* DCA / TWAP Content */}
          {["dca", "twap"].map((tabInfo) => (
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
                  <Label className="text-white/70 font-mono text-xs">{tabInfo === "dca" ? "Amount per buy (XRP)" : "Total Amount (XRP)"}</Label>
                  <Input type="number" placeholder="50" value={tabInfo === "dca" ? amountPerBuy : amount} onChange={e => tabInfo === "dca" ? setAmountPerBuy(e.target.value) : setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70 font-mono text-xs"># Slices/Buys</Label>
                    <Input type="number" placeholder="10" value={numBuys} onChange={e => setNumBuys(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 font-mono text-xs">Interval (seconds)</Label>
                    <Input type="number" placeholder="3600" value={ticketInterval} onChange={e => setTicketInterval(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
                  </div>
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4">
                  {isSubmitting ? "SIGNING..." : `EXECUTE ${tabInfo.toUpperCase()}`}
                </Button>
              </form>
            </TabsContent>
          ))}
          
        </Tabs>
      </CardContent>
    </Card>
  );
}
