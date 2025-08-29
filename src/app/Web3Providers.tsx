"use client";

import { useState, useEffect, ReactNode } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { chains, client } from "../lib/config";
import { OCConnect } from '@opencampus/ocid-connect-js';
import { useAccount } from "wagmi";

const queryClient = new QueryClient();

export default function Web3Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof createConfig> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
      if (!projectId) throw new Error("Project ID is not set");
      const connectors = connectorsForWallets(
        [{ groupName: "Recommended", wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet] }],
        { projectId, appName: "Capybility" }
      );
      const config = createConfig({ chains, client, connectors });
      setWagmiConfig(config);
    } catch (error) {
      console.error("Web3Providers Error:", error);
    }
  }, []);

  // Define the options for the OCConnect provider as per the new guide
  const ocidOpts = {
    clientId: process.env.NEXT_PUBLIC_OCID_CLIENT_ID!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/ocid-redirect`,
  };

  function ReferralConnectEffect() {
    const { isConnected, address } = useAccount();
    useEffect(() => {
      // On wallet connect, trigger referral DB entry only once per session
      if (isConnected && address && typeof window !== 'undefined') {
        const referrer = sessionStorage.getItem('referrer');
        const referralSubmitted = sessionStorage.getItem('referralSubmitted');
        if (referrer && referrer !== address && !referralSubmitted) {
          console.log('[Referral] Wallet connect: Triggering referral DB entry:', { referer: referrer, referee: address });
          fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referer: referrer, referee: address })
          }).then(() => {
            sessionStorage.setItem('referralSubmitted', 'true');
          }).catch(() => {
            // Optionally handle error, but do not set flag
          });
        }
      }
    }, [isConnected, address]);
    return null;
  }

  if (!mounted || !wagmiConfig) {
    return <div>Loading Web3 providers...</div>;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <ReferralConnectEffect />
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <OCConnect opts={ocidOpts} sandboxMode={false}>
            {children}
          </OCConnect>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}