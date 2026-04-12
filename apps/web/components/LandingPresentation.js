"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import FeatureShowcase from "./FeatureShowcase";
import Waves from "./Waves";


export function LandingPresentation({ onLaunch }) {
  const containerRef = useRef(null);
  
  // Track scroll progress relative to this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Map scroll progress (0 to 1) to opacity (0 to 1) for the black background
  // Black background fades in quickly
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const features = [
    {
      id: "01",
      title: "LIQUIDITY VAULTS",
      protocol: "XLS-65",
      desc: "Earn organic single-sided yield directly on the XRPL. Zero smart contract risk. Stake XRP and mint MPToken LP shares natively.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    },
    {
      id: "02",
      title: "DEBT POSITIONS",
      protocol: "XLS-66",
      desc: "Borrow assets instantly against your Vault collateral. Manage overcollateralized debt natively through Escrows and cross-currency offers.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    },
    {
      id: "03",
      title: "ZK-PRIVACY",
      protocol: "GROTH5",
      desc: "Execute Advanced Stop-Loss & Take-Profit orders while keeping your trigger prices hidden on-chain. Powered by RISC0 zkVM.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    }
  ];

  return (
    <>
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="fixed inset-0 bg-[#02040a] z-10 pointer-events-none"
      />
      
      {/* Top scroll mask to hide text under the transparent fixed header */}
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="fixed top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#02040a] via-[#02040a]/90 to-transparent z-40 pointer-events-none"
      />
      
      <div ref={containerRef} className="w-full mt-[60vh] pb-32 text-left relative z-20 font-mono">
        <div className="max-w-6xl mx-auto px-6 relative z-20">
          
          {/* Abstract Statement */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="mb-[60vh] max-w-4xl border-l border-white/20 pl-8"
          >
            <h2 className="text-2xl md:text-5xl font-normal uppercase tracking-tighter mb-6 text-white" style={{ fontFamily: "'Bitcount Grid', monospace" }}>
              Bypassing the EVM.<br />
              <span className="text-white/40">Pure Native Execution.</span>
            </h2>
            <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-2xl">
              Pyramid composes Vaults, Loans, and the native DEX into a unified trading environment. 
              No hooks, no fragmented liquidity, just XRPL primitives pushed to their absolute limit.
            </p>
          </motion.div>

          {/* Brutalist Architecture Rows - Interactive Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col w-full mt-24 shadow-2xl relative"
          >
            <div className="absolute inset-x-0 -top-40 bottom-0 pointer-events-none z-0" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
              <Waves
                lineColor="rgba(0, 184, 255, 0.3)"
                backgroundColor="transparent"
                waveSpeedX={0.0125}
                waveSpeedY={0.01}
                waveAmpX={40}
                waveAmpY={20}
                friction={0.9}
                tension={0.01}
                maxCursorMove={200}
                xGap={12}
                yGap={36}
              />
            </div>
            <div className="relative z-10 w-full">
              <FeatureShowcase features={features} onLaunch={onLaunch} />
            </div>
          </motion.div>

          {/* Tech Stats - Monolithic Serious Effect */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mt-40 grid grid-cols-2 md:grid-cols-4 border border-white/20 bg-black/40 backdrop-blur-md relative overflow-hidden group cursor-default"
          >
            {/* Glossy Scanline Effect on hover */}
            <motion.div 
              initial={{ x: "-100%" }}
              whileInView={{ x: "200%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 w-1/2 pointer-events-none z-0" 
            />
            
            {[
              { label: "NETWORK", val: "DEVNET", col: "md:border-r border-b md:border-b-0", accent: "text-white group-hover:opacity-100 text-white/70 transition-opacity duration-500" },
              { label: "LATENCY", val: "~300ms", col: "md:border-r border-b md:border-b-0", accent: "text-emerald-400" },
              { label: "SMART CONTRACTS", val: "ZERO", col: "md:border-r border-b border-r-0 md:border-b-0", accent: "text-red-500" },
              { label: "ZKP SYSTEM", val: "RISC0 zkVM", col: "", accent: "text-white group-hover:opacity-100 text-white/70 transition-opacity duration-500" }
            ].map((stat, i) => (
              <div key={i} className={`p-8 md:p-10 border-white/20 ${stat.col} flex flex-col justify-center items-center text-center relative overflow-hidden`}>
                <span className="text-[10px] text-white/30 mb-2 uppercase tracking-[0.3em] z-10 transition-colors duration-500 group-hover:text-white/50">{stat.label}</span>
                
                {/* Blur reveal text on view */}
                <motion.div 
                  initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + (i * 0.15) }}
                  className="z-10"
                >
                  <span className={`text-2xl md:text-3xl font-bold tracking-widest ${stat.accent || "text-white"}`} style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                    {stat.val}
                  </span>
                </motion.div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </>
  );
}
