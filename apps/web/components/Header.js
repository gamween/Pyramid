"use client";

import { WalletConnector } from "./WalletConnector";
import { useWalletManager } from "../hooks/useWalletManager";
import { useWallet } from "./providers/WalletProvider";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

export function Header({ isAppLaunched, onLaunch, onGoHome, tabsNode }) {
  useWalletManager();
  const { statusMessage } = useWallet();

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${isAppLaunched ? "bg-black/60 backdrop-blur-md border-b border-white/10" : "bg-transparent mix-blend-difference"}`}>
      <div className={`container mx-auto flex items-center justify-between px-6 transition-all duration-700 ${isAppLaunched ? "h-20" : "h-24"}`}>
        
        {/* Left Side: Logo */}
        <button onClick={onGoHome} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity outline-none text-left">
          
          <img src="/logo.png" alt="Pyramid Logo" className={`object-contain transition-all duration-500 ${isAppLaunched ? "h-10 w-10 md:h-10 md:w-10" : "h-16 w-16 md:h-20 md:w-20 drop-shadow-md"}`} />
          <span className={`tracking-[0.1em] font-bold text-white uppercase transition-all duration-500 ${isAppLaunched ? "text-lg md:text-xl" : "text-2xl"}`} style={{ fontFamily: "'Bitcount Grid', monospace" }}>
            Pyramid
          </span>
        
        </button>

        {/* Center: TabsNode (only if app launched) */}
        <div className="flex-1 flex justify-center overflow-x-auto mx-4 hidden md:flex">
          {isAppLaunched && tabsNode}
        </div>

        {/* Right Side: Action Button */}
        <div className="flex items-center justify-end gap-4 min-w-[200px]">
          {statusMessage && (
            <Badge
              variant={
                statusMessage.type === "success"
                  ? "success"
                  : statusMessage.type === "error"
                  ? "destructive"
                  : statusMessage.type === "warning"
                  ? "warning"
                  : "secondary"
              }
              className="hidden lg:inline-flex"
            >
              {statusMessage.message}
            </Badge>
          )}

          {!isAppLaunched && (
            <button 
              onClick={onLaunch}
              className="border border-white/50 bg-black/50 hover:bg-white hover:text-black text-white font-mono px-6 py-3 tracking-widest text-sm uppercase transition-all duration-300"
            >
              Launch App
            </button>
          )}
          <div className={!isAppLaunched ? "hidden" : "block"}>
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Mobile Tabs: Show below header if on mobile and launched */}
      {isAppLaunched && (
        <div className="md:hidden flex justify-center border-t border-white/10 bg-black/80 backdrop-blur-md px-2 scrollbar-none overflow-x-auto py-2">
          {tabsNode}
        </div>
      )}
    </header>
  );
}
