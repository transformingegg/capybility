import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex justify-center md:justify-start max-w-[400px]">
              <Image
                src="/Banner.png"
                alt="Pruv.it Banner"
                width={400}
                height={120}
                priority
                className="h-auto w-full"
              />
            </div>
            <div className="flex justify-center md:justify-end">
              <ConnectButton />
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