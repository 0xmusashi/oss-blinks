import type { Metadata } from "next";

import { Navbar } from "@/app/components/navbar";

// Providers are used to wrap the app in Wagmi and ConnectKit
import AppWalletProvider from "@/app/components/AppWalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wormhole OSS Blinks",
  description:
    "Donate to OSS projects with Wormhole NTT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>
          <Navbar />
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}
