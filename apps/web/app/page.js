"use client";

import LEDPyramid from "../components/three/LEDPyramid";
import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";
import { VaultInteraction } from "../components/VaultInteraction";
import { AdvancedTradingForm } from "../components/AdvancedTradingForm";
import { ProtocolStats } from "../components/ProtocolStats";
import { ZkPrivacy } from "../components/ZkPrivacy";
import { ActivePositions } from "../components/ActivePositions";
import { LoanInteraction } from "../components/LoanInteraction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-auto bg-black text-white selection:bg-slate-500/30 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <LEDPyramid />
      </div>

      {/* Grid overlay for a more tech/terminal vibe */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <div className="relative z-20 flex flex-col min-h-screen">
        <Header />

        {/* Hero Section */}
        <div className="flex-none pt-32 pb-4 text-center relative z-10 pointer-events-none">
          <h1 
            className="text-7xl md:text-[10rem] text-white uppercase tracking-tighter"
            style={{ fontFamily: "'Bitcount Grid', monospace" }}
          >
            PYRAMID
          </h1>
          <p className="mt-8 md:mt-12 text-xs md:text-sm text-white/90 uppercase tracking-[0.5em] border-y border-white inline-block py-3 px-8 bg-transparent" style={{ fontFamily: "'Bitcount Grid', monospace" }}>
            Native Lending & ZK-Trading on XRPL
          </p>
        </div>

        {/* App Dashboard - Glassmorphism, Brutalist, no rounded corners */}
        <main className="flex-1 w-full z-20 mt-12 px-4 md:px-12">
          <div className="max-w-7xl mx-auto pb-12">
            
            <Tabs defaultValue="dashboard" className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="bg-transparent border-b-2 border-white/20 p-0 h-auto rounded-none w-full max-w-2xl flex justify-between gap-0">
                  <TabsTrigger 
                    value="dashboard" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none w-1/3 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
                  >
                    [01] Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lending" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none w-1/3 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
                  >
                    [02] Lending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trading" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none w-1/3 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
                  >
                    [03] ZK Trade
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* DASHBOARD TAB */}
              <TabsContent value="dashboard" className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <ProtocolStats />
                </div>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                  <div className="lg:col-span-1 border border-white/20 bg-black/40 backdrop-blur-xl p-0">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Identity</h2>
                    </div>
                    <AccountInfo />
                  </div>
                  <div className="lg:col-span-2 border border-white/20 bg-black/40 backdrop-blur-xl relative">
                    <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Direct TX</h2>
                      <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="p-6">
                      <TransactionForm />
                    </div>
                  </div>
                </div>
                <ActivePositions />
              </TabsContent>

              {/* LENDING TAB */}
              <TabsContent value="lending" className="animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Vault Interaction (XLS-65)</h2>
                    </div>
                    <div className="p-4">
                      <VaultInteraction />
                    </div>
                  </div>
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Loan Interface (XLS-66)</h2>
                    </div>
                    <div className="p-4">
                      <LoanInteraction />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TRADING TAB */}
              <TabsContent value="trading" className="animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Advanced Trade (Escrow)</h2>
                    </div>
                    <div className="p-4">
                      <AdvancedTradingForm />
                    </div>
                  </div>
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col justify-center text-center">
                    <div className="p-6 relative flex flex-col justify-center h-full">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-10 w-10 border border-slate-500 bg-black flex items-center justify-center">
                          <span className="font-mono text-sm font-bold text-slate-400">ZK</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Groth5 Privacy</h3>
                      </div>
                      <ZkPrivacy />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

