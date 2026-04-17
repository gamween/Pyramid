"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "../components/providers/WalletProvider";
import { registerDomEventListeners } from "../lib/wallet-listeners";

export function useWalletConnector(walletManager) {
  const walletConnectorRef = useRef(null);
  const { addEvent, showStatus } = useWallet();

  useEffect(() => {
    if (!walletConnectorRef.current || !walletManager) return;

    const connector = walletConnectorRef.current;
    let cleanupListeners = () => {};
    let cancelled = false;

    const setupConnector = async () => {
      // Wait for custom element to be defined and upgraded
      await customElements.whenDefined("xrpl-wallet-connector");

      // Small delay to ensure the element is fully initialized
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (cancelled) {
        return;
      }

      if (connector && typeof connector.setWalletManager === "function") {
        connector.setWalletManager(walletManager);

        // Listen to connector events
        const handleConnecting = (e) => {
          showStatus(`Connecting to ${e.detail.walletId}...`, "info");
        };

        const handleConnected = (e) => {
          showStatus("Connected successfully!", "success");
          addEvent("Connected via Web Component", e.detail);
        };

        const handleError = (e) => {
          showStatus(`Connection failed: ${e.detail.error.message}`, "error");
          addEvent("Connection Error", e.detail);
        };

        cleanupListeners = registerDomEventListeners(connector, {
          connecting: handleConnecting,
          connected: handleConnected,
          error: handleError,
        });
      }
    };

    setupConnector();

    return () => {
      cancelled = true;
      cleanupListeners();
    };
  }, [walletManager, addEvent, showStatus]);

  return walletConnectorRef;
}
