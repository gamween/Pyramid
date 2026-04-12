"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import LEDPyramid from "../components/three/LEDPyramid";
import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";
import { VaultInteraction } from "../components/VaultInteraction";
import { AdvancedTradingForm } from "../components/AdvancedTradingForm";
import { ProtocolStats } from "../components/ProtocolStats";
import { LandingPresentation } from "../components/LandingPresentation";
import { ZkPrivacy } from "../components/ZkPrivacy";
import { ActivePositions } from "../components/ActivePositions";
import { LoanInteraction } from "../components/LoanInteraction";
import { LendingShowcase } from "../components/LendingShowcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function Home() {
  const [isAppLaunched, setIsAppLaunched] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const tabsNode = (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-2xl flex justify-between gap-1 md:gap-4 relative mt-2 group">
      {/* Background track for all tabs */}
      <div className="absolute inset-0 bg-[#02040a]/40 border border-white/5 pointer-events-none" />
      
      {["dashboard", "lending", "trading"].map((tab, i) => {
        const isActive = activeTab === tab;
        return (
          <TabsTrigger 
            key={tab}
            value={tab} 
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white/90 py-4 px-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] transition-colors z-10 group/tab ${isActive ? "text-white" : "text-white/40"}`}
          >
            {/* The Text Layer */}
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full">
              <span className={`transition-colors duration-500 font-bold ${isActive ? "text-white focus:text-white" : "text-white/10 group-hover/tab:text-white/40"}`}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span>{tab.replace("-", " ")}</span>
            </div>

            {/* Hover Teaser Box */}
            {!isActive && (
              <div className="absolute inset-0 bg-white/[0.01] border border-white/0 group-hover/tab:border-white/10 transition-all duration-300 pointer-events-none z-0 opacity-0 group-hover/tab:opacity-100">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
              </div>
            )}
            
            {/* The Animated "Target Lock" HUD Box */}
            {isActive && (
              <motion.div 
                layoutId="tab-hud-box"
                className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              >
                {/* 4 Cyber/HUD Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
                
                {/* Scanning line effect */}
                <motion.div 
                  initial={{ y: "0%" }}
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[1px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"
                />
              </motion.div>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );

  return (
    <div className="min-h-screen relative overflow-auto bg-black text-white selection:bg-slate-500/30 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <LEDPyramid />
      </div>

      {/* Grid overlay for a more tech/terminal vibe */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <div className="relative z-20 flex flex-col min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col pt-20 md:pt-24">
          <Header isAppLaunched={isAppLaunched} onLaunch={() => setIsAppLaunched(true)} onGoHome={() => setIsAppLaunched(false)} tabsNode={tabsNode} />

        {!isAppLaunched ? (
          <>
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

        <LandingPresentation onLaunch={() => setIsAppLaunched(true)} />
        </>
        ) : (
          <main className="flex-1 w-full z-20 mt-8 px-4 md:px-12 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto pb-12">
              
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
                <LendingShowcase />
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
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col h-full">
                    <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Groth5 ZK Prover</h2>
                      <span className="text-[10px] font-mono text-slate-400 bg-black px-2 py-1 border border-slate-700">RISC0</span>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto scrollbar-none">
                      <ZkPrivacy />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
          </div>
        </main>
        )} 
        </Tabs>
      </div>
    </div>
  );
}

