"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaXTwitter, FaDiscord, FaTelegram } from 'react-icons/fa6';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Container that's column on mobile, row on desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
            {/* Banner - centered on mobile, left-aligned on desktop */}
            <div className="flex justify-center md:justify-start">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/img/banner.png"
                  alt="CAPYBILITY"
                  width={400}
                  height={80}
                  priority
                  className="h-auto"
                />
              </Link>
            </div>

            {/* Navigation and wallet container */}
            <div className="flex flex-col items-center space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-8 mt-4 md:mt-0">
              {/* Hamburger menu button - mobile only */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
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

              {/* Desktop navigation */}
              <nav className="hidden md:flex space-x-4">
                <Link href="/" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Home
                </Link>
                <Link href="/creator-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Creators
                </Link>
                <Link href="/user-dashboard" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Quizzers
                </Link>
                <Link href="/why-capybility" className="text-[#00c7df] hover:opacity-80 font-bold">
                  Why?
                </Link>
              </nav>

              {/* Wallet connect button */}
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="pt-20 pb-6 px-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-[#00c7df] hover:opacity-80 font-bold text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/creator-dashboard" 
                className="text-[#00c7df] hover:opacity-80 font-bold text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Creators
              </Link>
              <Link 
                href="/user-dashboard" 
                className="text-[#00c7df] hover:opacity-80 font-bold text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Quizzers
              </Link>
              <Link 
                href="/why-capybility" 
                className="text-[#00c7df] hover:opacity-80 font-bold text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Why?
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
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
              href="https://discord.gg/capybility" 
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