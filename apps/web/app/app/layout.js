"use client"

import { WalletProvider } from "../../components/providers/WalletProvider"
import PrismBackground from "../../components/three/PrismBackground"

export default function AppLayout({ children }) {
  return (
    <div
      className="dark relative min-h-screen overflow-auto bg-black text-white selection:bg-slate-500/30 font-sans"
      style={{ backgroundColor: "#02040a" }}
    >
      <PrismBackground />
      <WalletProvider>
        <div className="relative z-10 min-h-screen">{children}</div>
      </WalletProvider>
    </div>
  )
}
