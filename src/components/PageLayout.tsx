"use client";
import { NavMenu } from "./ui/NavMenu";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useState } from "react";
import { useCapyStatus } from './CapyStatusContext';
import { FaXTwitter, FaDiscord, FaTelegram } from 'react-icons/fa6';

interface PageLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  backgroundImage?: string;
}

export default function PageLayout({ children, fullWidth = false, backgroundImage }: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCapyHolder } = useCapyStatus();
  return (
    <div
      className={`min-h-screen flex flex-col ${fullWidth ? '' : 'bg-gray-50'}`}
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
            <div className="flex-shrink-0">
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

            {/* Mobile: Hamburger menu left, RainbowKit connector right, NFT badge */}
            <div className="flex items-center justify-between w-full mt-4 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="flex items-center">
                <ConnectButton accountStatus="address" chainStatus="icon" />
                {isCapyHolder && (
                  <span
                    title="Capybility NFT Holder"
                    className="ml-2 inline-flex items-center justify-center rounded-full bg-[#00c7df] text-white font-bold"
                    style={{ width: 22, height: 22, fontSize: 16 }}
                  >C</span>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <Link href="/" className="text-[#00c7df] hover:opacity-80 font-bold">Home</Link>
                <Link href="/creator-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold whitespace-nowrap">Creator Dashboard</Link>
                <Link href="/user-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold whitespace-nowrap">User Dashboard</Link>
                <NavMenu />
              </nav>
              <div className="flex items-center">
                <ConnectButton />
                {isCapyHolder && (
                  <span
                    title="Capybility NFT Holder"
                    className="ml-2 inline-flex items-center justify-center rounded-full bg-[#00c7df] text-white font-bold"
                    style={{ width: 22, height: 22, fontSize: 16 }}
                  >C</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-0 inset-x-0 z-50 bg-white shadow-lg">
            <div className="pt-20 pb-6 px-4">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="text-[#00c7df] hover:opacity-80 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                <Link href="/creator-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Creator Dashboard</Link>
                <Link href="/user-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>User Dashboard</Link>
                {/* Other Dropdown Items */}
                <Link href="/why-capybility" className="text-[#00c7df] hover:opacity-80 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Guide</Link>
                <Link href="/season-3-yuzu" className="text-[#00c7df] hover:opacity-80 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Season 3 Yuzu</Link>
              </nav>
            </div>
          </div>
        )}
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
          <div className="text-center text-sm text-gray-500 mt-4">
            &copy; {new Date().getFullYear()} Capybility. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}