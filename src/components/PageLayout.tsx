import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { address, isConnected } = useAccount();
  const [isCapyHolder, setIsCapyHolder] = useState(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setIsCapyHolder(false);
      return;
    }
    fetch(`/api/check-capy-status?address=${address}`)
      .then(res => res.json())
      .then(data => setIsCapyHolder(!!data.hasNFT))
      .catch(() => setIsCapyHolder(false));
  }, [address, isConnected]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex justify-center md:justify-start max-w-[400px]">
              <Link href="/" className="cursor-pointer transition-opacity hover:opacity-80">
              <Image
                src="/img/bannerNew.png"
                alt="Capybility Banner"
                width={400}
                height={120}
                priority
                className="h-auto w-full"
              />
              </Link>
            </div>
            <div className="flex justify-center md:justify-end">
              <ConnectButton />
              {isCapyHolder && (
                <span
                  title="Capybility NFT Holder"
                  className="inline-flex items-center justify-center rounded-full bg-[#00c7df] text-white font-bold"
                  style={{ width: 22, height: 22, fontSize: 16 }}
                >
                  C
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}