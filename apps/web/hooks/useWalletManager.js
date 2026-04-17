"use client";

import { useCallback, useEffect } from "react";
import { useWallet } from "../components/providers/WalletProvider";
import { registerManagerListeners } from "../lib/wallet-listeners";

// Configuration - Replace with your API keys
const XAMAN_API_KEY = process.env.NEXT_PUBLIC_XAMAN_API_KEY || "";
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export function useWalletManager() {
  const { walletManager, setWalletManager, setIsConnected, setAccountInfo, addEvent, showStatus } =
    useWallet();

  const updateConnectionState = useCallback(
    (manager) => {
      const connected = manager.connected;
      setIsConnected(connected);

      if (connected) {
        const account = manager.account;
        const wallet = manager.wallet;

        if (account && wallet) {
          setAccountInfo({
            address: account.address,
            network: `${account.network.name} (${account.network.id})`,
            walletName: wallet.name,
          });
        }
      } else {
        setAccountInfo(null);
      }
    },
    [setIsConnected, setAccountInfo]
  );

  useEffect(() => {
    let cleanupListeners = () => {};
    let cancelled = false;

    // Dynamic import to avoid SSR issues
    const initWalletManager = async () => {
      try {
        const {
          WalletManager,
          XamanAdapter,
          WalletConnectAdapter,
          CrossmarkAdapter,
          GemWalletAdapter,
          OtsuAdapter,
        } = await import("xrpl-connect");

        const adapters = [];

        // Only add Xaman if API key is available
        if (XAMAN_API_KEY) {
          adapters.push(new XamanAdapter({ apiKey: XAMAN_API_KEY }));
        }

        // Only add WalletConnect if project ID is available
        if (WALLETCONNECT_PROJECT_ID) {
          adapters.push(new WalletConnectAdapter({ projectId: WALLETCONNECT_PROJECT_ID }));
        }

        // Add browser extension wallets (no config needed)
        adapters.push(new CrossmarkAdapter());
        adapters.push(new GemWalletAdapter());
        adapters.push(new OtsuAdapter());

        const manager = new WalletManager({
          adapters,
          network: "devnet",
          autoConnect: false,
          logger: { level: "info" },
        });

        if (cancelled) {
          return;
        }

        setWalletManager(manager);

        cleanupListeners = registerManagerListeners(manager, {
          connect: (account) => {
            addEvent("Connected", account);
            updateConnectionState(manager);
          },
          disconnect: () => {
            addEvent("Disconnected", null);
            updateConnectionState(manager);
          },
          error: (error) => {
            addEvent("Error", error);
            showStatus(error.message, "error");
          },
        });

        // Check initial connection status (don't show message on landing page)
        if (!manager.connected) {
          // silent — the landing page has its own CTA
        } else {
          showStatus("Wallet reconnected from previous session", "success");
          updateConnectionState(manager);
        }

        console.log("XRPL Connect initialized", manager);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to initialize wallet manager:", error);
          showStatus("Failed to initialize wallet connection", "error");
        }
      }
    };

    initWalletManager();
    return () => {
      cancelled = true;
      cleanupListeners();
    };
  }, [setWalletManager, addEvent, showStatus, updateConnectionState]);

  return { walletManager };
}
