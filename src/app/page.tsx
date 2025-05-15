"use client";

import { Blink, useBlink } from "@dialectlabs/blinks";
import { useBlinkSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import "@dialectlabs/blinks/index.css";
import { useState } from "react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [blinkApiUrl, setBlinkApiUrl] = useState("http://localhost:3000/api/actions/donate");

  // Adapter, used to connect to the wallet
  const { adapter } = useBlinkSolanaWalletAdapter(
    "https://api.devnet.solana.com"
  );

  // Blink we want to execute
  const { blink, isLoading } = useBlink({ url: blinkApiUrl });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update the blinkApiUrl with query parameters
    const updatedUrl = `${window.location.origin}/api/actions/donate?to=${encodeURIComponent(walletAddress)}&repo=${encodeURIComponent(githubRepo)}`;
    setBlinkApiUrl(updatedUrl);
  };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] min-h-[calc(100vh-64px)]">
      <div className="col-span-1 p-4 lg:p-8 lg:pr-16 flex flex-col justify-center">
        <h1 className="text-[32px] lg:text-[40px] mb-3 font-bold leading-[1]">
          OSS Blinks
        </h1>
        <h2 className="text-[16px] lg:text-[18px] mb-2">Donate to public good OSS repos with Wormhole NTT</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm">
          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 text-gray-900 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter Solana wallet address"
              required
            />
          </div>

          <div>
            <label htmlFor="githubRepo" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              id="githubRepo"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 text-gray-900 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://github.com/username/repo"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition font-medium text-sm"
          >
            Create Blink
          </button>
        </form>
      </div>

      <div className="flex flex-col items-center justify-center lg:border rounded-[10px] m-4 p-6">
        <br />
        {isLoading || !blink ? (
          <span>Loading</span>
        ) : (
          <div className="w-full max-w-lg">
            <Blink
              blink={blink}
              adapter={adapter}
              securityLevel="all"
              stylePreset="x-dark"
            />
          </div>
        )}
      </div>
    </main>
  );
}
