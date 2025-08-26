import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FaXTwitter, FaDiscord, FaTelegram } from 'react-icons/fa6';

interface PageLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function PageLayout({ children, fullWidth = false }: PageLayoutProps) {
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
    <div className={`min-h-screen flex flex-col ${fullWidth ? '' : 'bg-gray-50'}`}>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <Image
                  src={fullWidth ? "/img/bannerSmall.webp" : "/img/bannerMain.webp"}
                  alt="Capybility Banner"
                  width={200} 
                  height={60}
                  priority
                  className="h-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Home
                </Link>
                <Link href="/creator-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Creator Dashboard
                </Link>
                <Link href="/user-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold">
                  User Dashboard
                </Link>
              </nav>
              <div className="flex items-center">
                <ConnectButton />
                {isCapyHolder && (
                  <span
                    title="Capybility NFT Holder"
                    className="ml-2 inline-flex items-center justify-center rounded-full bg-[#00c7df] text-white font-bold"
                    style={{ width: 22, height: 22, fontSize: 16 }}
                  >
                    C
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className={`flex-grow ${fullWidth ? "" : "p-6"}`}>
        <div className={fullWidth ? "" : "max-w-4xl mx-auto"}>
          {children}
        </div>
      </main>
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="w-full h-1 bg-black" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Social Icons */}
          <div className="flex justify-center space-x-6 mb-4">
            <a 
              href="https://twitter.com/capybility" 
              className="text-gray-500 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaXTwitter className="h-6 w-6" />
            </a>
            <a 
              href="https://t.me/capybility" 
              className="text-gray-500 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTelegram className="h-6 w-6" />
            </a>
            <a 
              href="https://discord.gg/hGYKakYugz" 
              className="text-gray-500 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord className="h-6 w-6" />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">
              Terms of Use
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy Policy
            </Link>
          </div>

          {/* Copyright */}
          <p className="mt-4 text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} CAPYBILITY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}