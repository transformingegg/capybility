"use client";

import { useState, useEffect } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { chains, client } from "../lib/config";
import { ReactNode } from "react";

// Create a QueryClient instance
const queryClient = new QueryClient();

export default function Web3Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof createConfig> | null>(null);

  useEffect(() => {
    console.log("Web3Providers: Mounting component...");
    setMounted(true);

    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
    if (!projectId) {
      console.error("Web3Providers: Project ID is not set in .env.local");
      return;
    }

    console.log("Web3Providers: Setting up connectors with projectId:", projectId);
    try {
      const connectors = connectorsForWallets(
        [
          {
            groupName: "Recommended",
            wallets: [
              metaMaskWallet,
              rainbowWallet,
              walletConnectWallet,
            ],
          },
        ],
        {
          projectId,
          appName: "Web Page Text Extractor & Analyzer",
        }
      );

      console.log("Web3Providers: Connectors created:", connectors);
      const config = createConfig({
        chains,
        connectors,
        client,
      });
      console.log("Web3Providers: wagmiConfig created:", config);
      setWagmiConfig(config);
    } catch (error) {
      console.error("Web3Providers: Error creating wagmiConfig:", error);
    }
  }, []);

  if (!mounted || !wagmiConfig) {
    console.log("Web3Providers: Waiting for wagmiConfig, mounted:", mounted, "config:", wagmiConfig);
    return <div>Loading Web3 providers...</div>;
  }

  console.log("Web3Providers: Rendering with wagmiConfig:", wagmiConfig);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}