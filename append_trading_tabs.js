const fs = require('fs');
const filePath = 'apps/web/components/AdvancedTradingForm.js';
let content = fs.readFileSync(filePath, 'utf8');

// The closing brace for the SL/TP mapping
const targetString = `          ))}
          
        </Tabs>`;

const insertIndex = content.indexOf(targetString);

if (insertIndex === -1) {
  console.error("Could not find target string to insert new tabs");
  process.exit(1);
}

const newTabs = `          ))}

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
                <Label className="text-white/70 font-mono text-xs">Amount (XRP drops)</Label>
                <Input type="number" placeholder="500000000" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
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
                <Label className="text-white/70 font-mono text-xs">Amount (XRP drops)</Label>
                <Input type="number" placeholder="500000000" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
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
                  <Label className="text-white/70 font-mono text-xs">{tabInfo === "dca" ? "Amount per buy (drops)" : "Total Amount (drops)"}</Label>
                  <Input type="number" placeholder="50000000" value={tabInfo === "dca" ? amountPerBuy : amount} onChange={e => tabInfo === "dca" ? setAmountPerBuy(e.target.value) : setAmount(e.target.value)} className="rounded-none bg-black border-white/30 text-white font-mono" />
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
                  {isSubmitting ? "SIGNING..." : \`EXECUTE \${tabInfo.toUpperCase()}\`}
                </Button>
              </form>
            </TabsContent>
          ))}
          
        </Tabs>`;

const updatedContent = content.substring(0, insertIndex) + newTabs + content.substring(insertIndex + targetString.length + 15);
fs.writeFileSync(filePath, updatedContent);
console.log("Appended tabs!");
