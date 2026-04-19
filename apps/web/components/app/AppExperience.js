"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useWalletManager } from "../../hooks/useWalletManager"
import { Header } from "../Header"
import LEDPyramid from "../three/LEDPyramid"
import { DEFAULT_APP_TAB } from "../../lib/app-shell"
import { Tabs } from "../ui/tabs"
import { AppPanels } from "./AppPanels"
import { AppTabsNav } from "./AppTabsNav"

export function AppExperience() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(DEFAULT_APP_TAB)
  useWalletManager()

  const tabsNode = <AppTabsNav activeTab={activeTab} />

  return (
    <div className="min-h-screen relative overflow-auto bg-black text-white selection:bg-slate-500/30 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <LEDPyramid />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <div className="relative z-20 flex flex-col min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col pt-20 md:pt-24">
          <Header
            isAppLaunched
            onLaunch={() => {}}
            onGoHome={() => router.push("/")}
            tabsNode={tabsNode}
          />

          <main className="flex-1 w-full z-20 mt-8 px-4 pb-12 animate-in fade-in duration-700 md:px-6">
            <AppPanels />
          </main>
        </Tabs>
      </div>
    </div>
  )
}
