"use client";

import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AccountInfo() {
  const { isConnected, accountInfo } = useWallet();

  if (!isConnected || !accountInfo) {
    return null;
  }

  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
        <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Account</CardTitle>
        <CardDescription className="text-slate-400 font-mono text-xs">Your connected wallet details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between border border-white/20 bg-white/5 p-3 rounded-none">
          <span className="text-xs font-mono text-white/50 uppercase">Address</span>
          <code className="text-xs font-mono text-white/90 truncate ml-4 max-w-[150px] md:max-w-xs">{accountInfo.address}</code>
        </div>
        <div className="flex items-center justify-between border border-white/20 bg-white/5 p-3 rounded-none">
          <span className="text-xs font-mono text-white/50 uppercase">Network</span>
          <span className="text-xs font-mono text-white/90">{accountInfo.network}</span>
        </div>
        <div className="flex items-center justify-between border border-white/20 bg-white/5 p-3 rounded-none">
          <span className="text-xs font-mono text-white/50 uppercase">Wallet</span>
          <span className="text-xs font-mono text-white/90">{accountInfo.walletName}</span>
        </div>
        <p className="text-xs font-mono text-white/30 text-center pt-2">
          Click your address in the header to disconnect
        </p>
      </CardContent>
    </Card>
  );
}
