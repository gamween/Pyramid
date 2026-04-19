"use client"

import { WalletProvider } from "../../components/providers/WalletProvider"
import PrismBackground from "../../components/three/PrismBackground"

export default function AppLayout({ children }) {
  return (
    <div className="app-shell dark relative min-h-screen overflow-auto selection:bg-slate-500/30">
      <PrismBackground />
      <WalletProvider>
        <div className="relative z-10 min-h-screen">{children}</div>
      </WalletProvider>
    </div>
  )
}
