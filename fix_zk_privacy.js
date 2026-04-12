const fs = require('fs');
const file = 'apps/web/components/ZkPrivacy.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `  return (
    <Card className="border-none bg-black/60 backdrop-blur-md rounded-none h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col justify-center">
        {!proofResult && !isProving ? (
          <form onSubmit={handleGenerateProof} className="space-y-4 text-left">
            <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400">Private Escrow Config</h3>
            </div>`;

const newStr = `  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Groth5 Privacy</CardTitle>
          <CardDescription className="text-slate-400 font-mono text-xs mt-1">
            Private Escrow Config via RISC0
          </CardDescription>
        </div>
        <div className="h-10 w-10 border border-slate-500 bg-black flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {!proofResult && !isProving ? (
          <form onSubmit={handleGenerateProof} className="space-y-4">`;

content = content.replace(oldStr, newStr);

// Also need to style the inner bits: 
// 1. remove "text-left" that we used to have (already removed in the above replace)
// 2. ensure inputs look good and not scrunched.
// 3. remove the h-full stuff that was on Card
const oldGrid = `            <div className="grid grid-cols-2 gap-4">
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
          </form>`;

const newGrid = `            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zkPair" className="text-white/70 font-mono text-xs">Asset Pair</Label>
                <Input
                  id="zkPair"
                  type="text"
                  value={assetPair}
                  onChange={(e) => setAssetPair(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zkAmount" className="text-white/70 font-mono text-xs">Amount (XRP)</Label>
                <Input
                  id="zkAmount"
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zkPrice" className="text-white/70 font-mono text-xs flex items-center justify-between">
                <span>Secret Trigger Price (USD)</span>
                <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">HIDDEN ON-CHAIN</span>
              </Label>
              <Input
                id="zkPrice"
                type="password"
                placeholder="Enter secret limit price..."
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20"
                required
              />
            </div>

            <div className="border border-white/20 bg-white/5 p-4 text-xs text-white/60 font-mono mt-4 leading-relaxed">
              <p>Your trigger price will be hashed and verified via <strong>Groth5</strong>. The contract only sees the Zero-Knowledge proof, never the raw price.</p>
            </div>

            <Button 
              type="submit" 
              disabled={isProving || !isConnected} 
              className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4 tracking-widest transition-colors"
            >
              {isConnected ? "GENERATE RISC0 PROOF" : "WALLET DISCONNECTED"}
            </Button>
          </form>`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync(file, content);
