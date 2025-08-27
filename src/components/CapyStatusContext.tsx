"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

interface CapyStatusContextType {
  isCapyHolder: boolean;
}

const CapyStatusContext = createContext<CapyStatusContextType>({ isCapyHolder: false });

export function useCapyStatus() {
  return useContext(CapyStatusContext);
}

export const CapyStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnected } = useAccount();
  const [isCapyHolder, setIsCapyHolder] = useState(false);
  const prevAddressRef = useRef<string | undefined>(undefined);
  const prevConnectedRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const prevAddress = prevAddressRef.current;
    const prevConnected = prevConnectedRef.current;
    const shouldCheck = (
      (!prevConnected && isConnected) ||
      (isConnected && address && address !== prevAddress)
    );
    if (shouldCheck) {
      fetch(`/api/check-capy-status?address=${address}`)
        .then(res => res.json())
        .then(data => setIsCapyHolder(!!data.hasNFT))
        .catch(() => setIsCapyHolder(false));
    }
    if (!isConnected) {
      setIsCapyHolder(false);
    }
    prevAddressRef.current = address;
    prevConnectedRef.current = isConnected;
  }, [address, isConnected]);

  return (
    <CapyStatusContext.Provider value={{ isCapyHolder }}>
      {children}
    </CapyStatusContext.Provider>
  );
};
