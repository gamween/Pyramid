"use client";

import { Card, CardContent } from "./ui/card";
import { Activity, Database, ShieldCheck, TrendingUp, Lock } from "lucide-react";

export function ProtocolStats() {
  // Mock data for the protocol dashboard
  const stats = [
    { label: "Total Value Locked", value: "14,502,340 XRP", icon: Lock, trend: "+5.2%" },
    { label: "Active Vaults (XLS-65)", value: "1,204", icon: Database, trend: "+12" },
    { label: "Active Loans (XLS-66)", value: "8,349", icon: Activity, trend: "+4.1%" },
    { label: "ZK-Proofs (Groth5)", value: "245,901", icon: ShieldCheck, trend: "+2.4%" },
    { label: "24h Volume", value: "2,104,000 XRP", icon: TrendingUp, trend: "-1.2%" },
  ];

  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-xl p-6">
      <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
        <div>
          <h2 className="text-lg font-mono uppercase tracking-widest text-white font-bold">Protocol Overview</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">Live metrics from XRPL Devnet & Groth5</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-mono text-green-500 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-white/20 bg-black/60 backdrop-blur-md rounded-none hover:bg-white/5 transition-colors">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <stat.icon className="h-5 w-5 text-white/50" />
                <span className={`text-[10px] font-mono ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-white/50 mb-1 leading-tight h-6">{stat.label}</p>
                <p className="text-sm md:text-base font-bold font-mono text-white tracking-widest">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Network Status Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
        <p>Devnet: 5s ledger close</p>
        <p>Groth5: ZK Prover Ready</p>
        <p>Last Sync: Just now</p>
      </div>
    </div>
  );
}
