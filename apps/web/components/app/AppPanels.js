"use client"

import { AccountInfo } from "../AccountInfo"
import { ActivePositions } from "../ActivePositions"
import { AdvancedTradingForm } from "../AdvancedTradingForm"
import { EarnYieldPage } from "../EarnYieldPage"
import { LendingShowcase } from "../LendingShowcase"
import { LoansPage } from "../LoansPage"
import { ProtocolStats } from "../ProtocolStats"
import { TransactionForm } from "../TransactionForm"
import { ZkPrivacy } from "../ZkPrivacy"
import { TabsContent } from "../ui/tabs"

export function AppPanels() {
  return (
    <>
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
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Direct TX
              </h2>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div className="p-6">
              <TransactionForm />
            </div>
          </div>
        </div>
        <ActivePositions />
      </TabsContent>

      <TabsContent value="lending" className="animate-in fade-in duration-500">
        <EarnYieldPage />
        <LendingShowcase />
      </TabsContent>

      <TabsContent value="loans" className="animate-in fade-in duration-500">
        <LoansPage />
      </TabsContent>

      <TabsContent value="trading" className="animate-in fade-in duration-500">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
            <div className="p-4 border-b border-white/20 bg-white/5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Advanced Trade (Escrow)
              </h2>
            </div>
            <div className="p-4">
              <AdvancedTradingForm />
            </div>
          </div>
          <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col h-full">
            <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Groth5 ZK Prover
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-black px-2 py-1 border border-slate-700">
                RISC0
              </span>
            </div>
            <div className="p-6 flex-1 overflow-y-auto scrollbar-none">
              <ZkPrivacy />
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  )
}
