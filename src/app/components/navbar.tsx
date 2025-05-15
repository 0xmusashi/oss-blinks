"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full px-4 py-3 flex justify-between items-center relative">
      {/* OSS Logo */}
      <Link
        href="https://github.com/0xNetero/oss-blinks/"
        className="flex items-center h-[40px]"
        target="_blank"
      >
        <Image
          src="/oss-logo.png"
          alt="OSS Blinks Logo"
          width={360}
          height={80}
          className="object-contain h-full w-auto"
          priority
        />
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        <WalletMultiButton />
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center">
          <span className={`block w-full h-0.5 bg-white mb-1 transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-full h-0.5 bg-white mb-1 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-full h-0.5 bg-white transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-gray-800 md:hidden">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
