"use client";

import LEDPyramid from "../components/three/LEDPyramid";
import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";
import { VaultInteraction } from "../components/VaultInteraction";
import { AdvancedTradingForm } from "../components/AdvancedTradingForm";
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
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[flow_5s_linear_infinite]"></div>
                    <div className="relative z-10 p-8">
                      <div className="mx-auto h-16 w-16 border border-white bg-black flex items-center justify-center mb-6">
                        <span className="font-mono text-2xl font-bold">L</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Loan Broker</h3>
                      <p className="text-white/60 mb-8 font-mono text-sm max-w-sm mx-auto">
                        Borrow XRP directly from Vault Liquidity (XLS-66). Yield distributes automatically to LP MPTokens.
                      </p>
                      <button className="border-2 border-white hover:bg-white hover:text-black text-white py-3 px-8 text-sm font-mono uppercase tracking-widest transition-all duration-300 disabled:opacity-50">
                        Request Co-Signature
                      </button>
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
                    <div className="p-8 relative">
                      <div className="mx-auto h-16 w-16 border border-slate-500 bg-black flex items-center justify-center mb-6">
                        <span className="font-mono text-xl font-bold text-slate-400">ZK</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Groth5 Privacy</h3>
                      <p className="text-white/60 mb-8 font-mono text-sm max-w-sm mx-auto leading-relaxed">
                        Prices are hidden off-chain via RISC0 ZK proofs and verified on-chain via WASM Smart Escrows (XLS-0100).
                      </p>
                      <button className="bg-white hover:bg-gray-200 text-black py-3 px-8 font-bold font-mono text-sm uppercase tracking-widest transition-all duration-300">
                        Activate ZK-Snarks
                      </button>
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

