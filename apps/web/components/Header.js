"use client";

import { WalletConnector } from "./WalletConnector";
import { useWalletManager } from "../hooks/useWalletManager";
import { useWallet } from "./providers/WalletProvider";
import { Badge } from "./ui/badge";

export function Header() {
  useWalletManager();
  const { statusMessage } = useWallet();

  return (
    <header className="fixed top-0 z-50 w-full bg-transparent mix-blend-difference">
      <div className="container flex h-24 items-center px-6">
        <div className="flex items-center gap-6">
          <img src="/logo.png" alt="Pyramid Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-md" />
          <span className="text-2xl tracking-[0.1em] font-bold text-white uppercase" style={{ fontFamily: "'Bitcount Grid', monospace" }}>Pyramid</span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
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
            >
              {statusMessage.message}
            </Badge>
          )}
          <WalletConnector />
        </div>
      </div>
    </header>
  );
}
