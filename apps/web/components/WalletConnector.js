"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./providers/WalletProvider";
import { useWalletConnector } from "../hooks/useWalletConnector";

const THEMES = {
  dark: {
    "--xc-background-color": "#000000",
    "--xc-background-secondary": "#111111",
    "--xc-background-tertiary": "#222222",
    "--xc-text-color": "#ffffff",
    "--xc-text-muted-color": "rgba(255, 255, 255, 0.5)",
    "--xc-primary-color": "#ffffff",
  },
  sleek: {
    "--xc-background-color": "rgba(0, 0, 0, 0.8)",
    "--xc-background-secondary": "rgba(20, 20, 20, 0.8)",
    "--xc-background-tertiary": "rgba(40, 40, 40, 0.8)",
    "--xc-text-color": "#ffffff",
    "--xc-text-muted-color": "rgba(255, 255, 255, 0.6)",
    "--xc-primary-color": "#e5e5e5",
  },
};

export function WalletConnector() {
  const { walletManager } = useWallet();
  const walletConnectorRef = useWalletConnector(walletManager);
  const [currentTheme] = useState("sleek");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Register the web component
    const registerWebComponent = async () => {
      try {
        const { WalletConnectorElement } = await import("xrpl-connect");

        // Define the custom element if not already defined
        if (!customElements.get("xrpl-wallet-connector")) {
          customElements.define("xrpl-wallet-connector", WalletConnectorElement);
        }
      } catch (error) {
        console.error("Failed to register wallet connector:", error);
      }
    };

    registerWebComponent();
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="relative group/wallet inline-block">
      {/* HUD Border Box */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/5 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:bg-white/10 group-hover/wallet:border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" />
      
      {/* Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/30" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/30" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/30" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/30" />

      {/* Wrapping the connector, trying to strip out default button BG via styles to let HUD shine through */}
      <div className="relative z-10 p-[1px]">
        <xrpl-wallet-connector
          ref={walletConnectorRef}
          id="wallet-connector"
          style={{
             ...THEMES[currentTheme],
            "--xc-font-family": "'Bitcount Grid', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "--xc-border-radius": "0px",
            "--xc-modal-box-shadow": "8px 8px 0 rgba(255, 255, 255, 0.05)",
            opacity: 0.9,
          }}
          primary-wallet="xaman"
        />
      </div>
    </div>
  );
}
