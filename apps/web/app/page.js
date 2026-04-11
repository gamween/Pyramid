"use client";

import LEDPyramid from "../components/three/LEDPyramid";
import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { ContractInteraction } from "../components/ContractInteraction";
import { TransactionForm } from "../components/TransactionForm";
import { MPTokenCard } from "../components/MPTokenCard";

export default function Home() {
  return (
    <div className="size-full relative overflow-hidden bg-black">
      <LEDPyramid />

      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-8xl tracking-tight text-white/90 uppercase" style={{ letterSpacing: "0.1em" }}>
            Pyramide
          </h1>
          <p className="text-sm md:text-base text-white/40 uppercase tracking-[0.3em]">
            LED Pixel Shader
          </p>
        </div>
      </div>

      <div className="h-screen" />

      <div className="relative z-20">
        <Header />

        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Pyramid
              </h1>
              <p className="text-white/50">DeFi on XRPL</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 text-white">
                <AccountInfo />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 text-white">
                <ContractInteraction />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 text-white">
                <TransactionForm />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 text-white">
                <MPTokenCard />
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
              <h2 className="font-semibold mb-3 text-white">Getting Started</h2>
              <ol className="text-sm text-white/50 space-y-2 list-decimal list-inside">
                <li>Connect your wallet using the button in the header</li>
                <li>Deploy your smart contract using Bedrock or XRPL CLI</li>
                <li>Interact with deployed contracts using the contract panel</li>
                <li>Send XRP transactions using the transaction form</li>
              </ol>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/10 py-6">
          <div className="container text-center text-sm text-white/30">
            Built with Pyramid
          </div>
        </footer>
      </div>
    </div>
  );
}

