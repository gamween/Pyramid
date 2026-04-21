"use client"

import { WalletProvider } from "../../components/providers/WalletProvider"
import { AppShellLayout } from "../../components/app/AppShellLayout"

export default function AppLayout({ children }) {
  return (
    <WalletProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </WalletProvider>
  )
}
