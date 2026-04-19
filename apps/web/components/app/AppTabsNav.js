"use client"

import { motion } from "framer-motion"

import { APP_TABS } from "../../lib/app-shell"
import { TabsList, TabsTrigger } from "../ui/tabs"

export function AppTabsNav({ activeTab }) {
  return (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-3xl flex justify-between gap-1 md:gap-4 relative mt-2 group">
      <div className="absolute inset-0 bg-[#02040a]/40 border border-white/5 pointer-events-none" />

      {APP_TABS.map(({ value: tab, label }, index) => {
        const isActive = activeTab === tab

        return (
          <TabsTrigger
            key={tab}
            value={tab}
            className={`relative flex-1 rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white/90 py-4 px-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] transition-colors z-10 group/tab ${isActive ? "text-white" : "text-white/40"}`}
          >
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full">
              <span
                className={`transition-colors duration-500 font-bold ${isActive ? "text-white focus:text-white" : "text-white/10 group-hover/tab:text-white/40"}`}
              >
                [{String(index + 1).padStart(2, "0")}]
              </span>
              <span>{label}</span>
            </div>

            {!isActive && (
              <div className="absolute inset-0 bg-white/[0.01] border border-white/0 group-hover/tab:border-white/10 transition-all duration-300 pointer-events-none z-0 opacity-0 group-hover/tab:opacity-100">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
              </div>
            )}

            {isActive && (
              <motion.div
                layoutId="tab-hud-box"
                className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />

                <motion.div
                  initial={{ y: "0%" }}
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[1px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"
                />
              </motion.div>
            )}
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
