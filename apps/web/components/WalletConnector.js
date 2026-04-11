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
    <xrpl-wallet-connector
      ref={walletConnectorRef}
      id="wallet-connector"
      style={{
        ...THEMES[currentTheme],
        "--xc-font-family": "'Courier New', Courier, monospace",
        "--xc-border-radius": "0px",
        "--xc-modal-box-shadow": "8px 8px 0 rgba(255, 255, 255, 0.2)",
      }}
      primary-wallet="xaman"
    />
  );
}
