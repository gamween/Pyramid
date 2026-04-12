"use client";

import "./globals.css";
import { WalletProvider } from "../components/providers/WalletProvider";
import PrismBackground from "../components/three/PrismBackground";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <title>Pyramid</title>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="relative min-h-screen bg-black text-white" style={{ backgroundColor: "#02040a" }}>
        <PrismBackground />
        <WalletProvider>
          <div className="relative z-10">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
