"use client";
"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const Web3Providers = dynamic(() => import("./Web3Providers").then((mod) => mod.default), {
  ssr: false,
  loading: () => <div>Loading Web3 providers...</div>,
});
import { CapyStatusProvider } from "../components/CapyStatusContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  console.log("ClientProviders: Rendering...");
  return (
    <Web3Providers>
      <CapyStatusProvider>
        {children}
      </CapyStatusProvider>
    </Web3Providers>
  );
}