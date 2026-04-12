"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Activity, AlertTriangle, ArrowRight, Lock, Database } from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { ADDRESSES } from "@/lib/constants";

export function ActivePositions() {
  const { getVaultInfo } = useVault();
  const [orders, setOrders] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [vaultsLoading, setVaultsLoading] = useState(true);

  // Fetch orders from watcher API
  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("http://localhost:3001/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrders(Array.isArray(data) ? data : []);
        }
      } catch {
        // watcher may be offline; leave orders empty
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Fetch vault info
  useEffect(() => {
    let cancelled = false;
    async function fetchVault() {
      try {
        const info = await getVaultInfo(ADDRESSES.VAULT_ID);
        if (!cancelled) {
          setVaults([{
            id: ADDRESSES.VAULT_ID.slice(0, 8),
            asset: "XRP",
            supplied: Number((info.totalAssets / 1_000_000).toFixed(0)).toLocaleString(),
            mptBalance: info.totalShares != null ? Number(info.totalShares).toLocaleString() + " shares" : "\u2014",
            apy: info.sharePrice != null ? ((info.sharePrice - 1) * 100).toFixed(2) + "%" : "\u2014",
          }]);
        }
      } catch {
        // leave vaults empty
      } finally {
        if (!cancelled) setVaultsLoading(false);
      }
    }
    fetchVault();
    return () => { cancelled = true; };
  }, [getVaultInfo]);

  // Map watcher orders to escrow display format
  const escrows = orders.map((o) => ({
    id: o.escrowId ? o.escrowId.slice(0, 8) : o.id || "\u2014",
    type: o.type || "\u2014",
    pair: o.pair || "\u2014",
    size: o.amount ? (Number(o.amount) / 1_000_000).toLocaleString() + " XRP" : "\u2014",
    trigger: o.triggerPrice ? `Price ${o.type === "STOP_LOSS" || o.type === "SL" ? "<" : ">"} $${o.triggerPrice}` : o.trailingPct ? `Trail ${o.trailingPct} bps` : "\u2014",
    status: o.status || "ACTIVE",
  }));

  // Loans: no real-time source yet, show empty
  const loans = [];

  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-xl mt-6">
      <div className="p-4 border-b border-white/20 bg-white/5 flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Active Positions & History
        </h2>
        <span className="text-[10px] font-mono text-white/50 bg-white/10 px-2 py-1">LIVE SYNC</span>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="escrows" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 rounded-none bg-transparent border border-white/20 p-0 h-auto">
            <TabsTrigger value="escrows" className="rounded-none border-r border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Escrows & Orders ({escrows.length})
            </TabsTrigger>
            <TabsTrigger value="vaults" className="rounded-none border-r border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Vaults (XLS-65) ({vaults.length})
            </TabsTrigger>
            <TabsTrigger value="loans" className="rounded-none border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Loans (XLS-66) ({loans.length})
            </TabsTrigger>
          </TabsList>

          {/* ESCROWS TAB */}
          <TabsContent value="escrows" className="animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono text-left border-collapse">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-3 border-b border-white/20 font-normal">ID / Type</th>
                    <th className="p-3 border-b border-white/20 font-normal">Pair</th>
                    <th className="p-3 border-b border-white/20 font-normal">Size</th>
                    <th className="p-3 border-b border-white/20 font-normal">Trigger (Condition)</th>
                    <th className="p-3 border-b border-white/20 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((escrow, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors text-white">
                      <td className="p-3">
                        <div className="font-bold">{escrow.id}</div>
                        <div className="text-[10px] text-slate-500">{escrow.type}</div>
                      </td>
                      <td className="p-3 text-slate-300">{escrow.pair}</td>
                      <td className="p-3">{escrow.size}</td>
                      <td className="p-3 text-amber-400 text-xs flex items-center gap-1 mt-1">
                        <Lock className="h-3 w-3" />
                        {escrow.trigger}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-[10px] px-2 py-1 ${escrow.status === 'LOCKED' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-500/20 text-slate-300'}`}>
                          {escrow.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {escrows.length === 0 && (
                <div className="text-center py-8 text-slate-500 font-mono text-xs uppercase">No active escrows found.</div>
              )}
            </div>
          </TabsContent>

          {/* VAULTS TAB */}
          <TabsContent value="vaults" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaults.map((vault, idx) => (
                <Card key={idx} className="border border-white/20 bg-black rounded-none">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-400" />
                        <span className="text-white font-mono font-bold">{vault.asset} Vault</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{vault.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono text-sm mb-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Supplied</p>
                        <p className="text-white">{vault.supplied}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">APY</p>
                        <p className="text-green-400 font-bold">{vault.apy}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">MPT Balance</span>
                      <span className="text-white flex items-center gap-2">
                        {vault.mptBalance}
                        <ArrowRight className="h-3 w-3 text-slate-500" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* LOANS TAB */}
          <TabsContent value="loans" className="animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono text-left border-collapse">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-3 border-b border-white/20 font-normal">Loan ID</th>
                    <th className="p-3 border-b border-white/20 font-normal">Principal</th>
                    <th className="p-3 border-b border-white/20 font-normal">Accrued Interest</th>
                    <th className="p-3 border-b border-white/20 font-normal text-center">Health Factor</th>
                    <th className="p-3 border-b border-white/20 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors text-white">
                      <td className="p-3 font-bold">{loan.id}</td>
                      <td className="p-3">{loan.principal}</td>
                      <td className="p-3 text-red-400">{loan.accrued}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs ${parseFloat(loan.health) > 1.5 ? 'text-green-400 border border-green-400/30' : 'text-amber-400 border border-amber-400/30'}`}>
                          {loan.health}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-1">
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
