"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import FeatureShowcase from "./FeatureShowcase";
import Waves from "./Waves";
import TechStats from "./TechStats";
import LiquidChrome from "./LiquidChrome";

export function LandingPresentation({ onLaunch }) {
  const containerRef = useRef(null);
  const abstractRef = useRef(null);
  const showcaseRef = useRef(null);
  const protocolRef = useRef(null);
  const chromeRef = useRef(null);
  
  // Track scroll progress relative to this container
  const { scrollYProgress } = useScroll({
    target: abstractRef,
    offset: ["start 100%", "center 50%"]
  });

  // Map scroll progress (0 to 1) to opacity (0 to 1) for the black background
  // Black background fades in exactly as the text reaches the center
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Fades in the Waves exactly when scrolling down to the cards
  const { scrollYProgress: showcaseScroll } = useScroll({
    target: showcaseRef,
    offset: ["start end", "start start"]
  });
  
  const wavesOpacity = useTransform(showcaseScroll, [0, 1], [0, 1]);

  // Handle Protocol Flow section (fade to black again)
  const { scrollYProgress: protocolScroll } = useScroll({
    target: protocolRef,
    offset: ["start 90%", "start 50%"]
  });
  
  // Black background covers the wave
  const protocolBgOpacity = useTransform(protocolScroll, [0, 1], [0, 1]);

  // Handle Liquid Chrome section (fade in Liquid over black)
  const { scrollYProgress: chromeScroll } = useScroll({
    target: chromeRef,
    offset: ["start 90%", "start 40%"]
  });

  const chromeOpacity = useTransform(chromeScroll, [0, 1], [0, 1]);

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
      {/* GLOBAL FIXED BACKGROUNDS TO PREVENT SHARP CUTOFFS */}

      {/* 1. Base Black Overlay (covering Prism below) */}
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="fixed inset-0 bg-[#02040a] z-10 pointer-events-none"
      />

      {/* 2. Waves Background */}
      <motion.div 
        style={{ opacity: wavesOpacity }} 
        className="fixed inset-0 z-[11] pointer-events-none overflow-hidden"
      >
        <Waves
          lineColor="rgba(0, 184, 255, 0.4)"
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
      </motion.div>

      {/* 3. Second Black Overlay (covering Waves at Protocol Flow) */}
      <motion.div 
        style={{ opacity: protocolBgOpacity }}
        className="fixed inset-0 bg-[#02040a] z-[12] pointer-events-none"
      />

      {/* 4. Liquid Chrome Overlay */}
      <motion.div 
        style={{ opacity: chromeOpacity }}
        className="fixed inset-0 z-[13] mix-blend-screen pointer-events-none overflow-hidden"
      >
        <div className="w-full h-full opacity-80" style={{ mixBlendMode: 'screen' }}>
          <LiquidChrome
              baseColor={[0.0, 0.05, 0.15]} 
              speed={0.6}
              amplitude={0.4}
              interactive={true}
          />
        </div>
      </motion.div>
      
      {/* Top scroll mask to hide text under the transparent fixed header */}
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="fixed top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#02040a] via-[#02040a]/90 to-transparent z-40 pointer-events-none"
      />
      
      {/* MAIN CONTENT CONTAINER */}
      <div ref={containerRef} className="w-full mt-[60vh] text-left relative z-20 font-mono">
        <div className="max-w-6xl mx-auto px-6 relative z-20 pb-32 pt-20">
          
          {/* Abstract Statement */}
          <motion.div 
            ref={abstractRef}
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
            ref={showcaseRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col w-full mt-24 shadow-2xl relative"
          >
            <div className="relative z-10 w-full">
              <FeatureShowcase features={features} onLaunch={onLaunch} />
            </div>
          </motion.div>

          {/* Tech Stats - Monolithic Serious Effect */}
          <TechStats />

        </div>

        {/* BOTTOM SECTION */}
        <div className="relative w-full z-20" ref={protocolRef}>

          {/* Protocol Flow */}
          <div className="max-w-6xl mx-auto px-6 relative z-10" ref={protocolRef}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="mt-32 mb-[40vh] max-w-5xl mx-auto border-t border-white/10 pt-24"
            >
              <h2 className="text-xl md:text-3xl font-normal uppercase tracking-widest mb-20 text-white text-center" style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                Protocol Flow
              </h2>
              
              <div className="flex flex-col md:flex-row gap-12 relative">
                 {/* Line connecting the steps */}
                 <div className="absolute top-8 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#00b8ff]/30 to-transparent hidden md:block -z-10" />
                 <div className="absolute left-[31px] top-8 bottom-8 w-[1px] bg-gradient-to-b from-transparent via-[#00b8ff]/30 to-transparent md:hidden -z-10" />
                 
                 {[
                   { step: "01", title: "LEND", desc: "Deposit native assets into XLS-65 Vaults. Generates immediate organic yield." },
                   { step: "02", title: "BORROW", desc: "Use LP shares as collateral for XLS-66 Loans without breaking the underlying position." },
                   { step: "03", title: "TRADE", desc: "Set up invisible triggers with RISC0 zero-knowledge proofs directly on the native DEX." }
                 ].map((item, i) => (
                   <div key={i} className="flex-1 flex flex-row md:flex-col items-start md:items-center gap-6 md:text-center group bg-[#02040a] p-4 relative z-10">
                     <div className="w-16 h-16 shrink-0 rounded-full border border-[#00b8ff]/20 bg-[#02040a] flex items-center justify-center text-[#00b8ff] font-bold text-xl group-hover:border-[#00b8ff]/60 group-hover:shadow-[0_0_20px_rgba(0,184,255,0.2)] transition-all duration-500">
                       {item.step}
                     </div>
                     <div className="pt-2 md:pt-4">
                       <h3 className="text-lg font-bold text-white mb-3 tracking-widest uppercase">{item.title}</h3>
                       <p className="text-sm text-white/50 leading-relaxed font-sans">{item.desc}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Trustless Infrastructure (Watcher & ZK) */}
            <motion.div
              ref={chromeRef}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="mt-[40vh] mb-32 max-w-5xl mx-auto border-t border-white/10 pt-24"
            >
              <h2 className="text-xl md:text-3xl font-normal uppercase tracking-widest mb-16 text-white text-center" style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                Trustless Execution
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Watcher Bot Card */}
                <div className="group border border-white/10 bg-[#02040a]/60 backdrop-blur-xl p-8 hover:bg-[#02040a]/80 hover:border-[#00b8ff]/40 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#00b8ff] font-mono text-xs tracking-widest">NODE.JS</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-4">Off-Chain Watcher</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    A decentralized, open-source bot network monitors the XRPL order books in real-time. When a secret trigger condition is met on the native DEX, the watcher detects it and initiates the resolution process without any central authority.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">XRPL.js v3</span>
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">Websockets</span>
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">Parked Scheduler Code</span>
                  </div>
                </div>

                {/* RISC0 ZK Card */}
                <div className="group border border-white/10 bg-[#02040a]/60 backdrop-blur-xl p-8 hover:bg-[#02040a]/80 hover:border-[#00b8ff]/40 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#00b8ff] font-mono text-xs tracking-widest">RUST / GROTH16</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-4">Zero-Knowledge Verification</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    The Watcher cannot execute Escrows on its own. It must submit the triggering market conditions to a RISC0 zkVM prover. The validity of the trade is cryptographically guaranteed and verified via Boundless before any settlement occurs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">RISC0 zkVM</span>
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">Boundless Market</span>
                    <span className="px-2 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/50">Smart Escrows</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="pb-40 pt-20 flex flex-col items-center justify-center text-center px-4"
            >
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-12" />
              <h2 className="text-3xl md:text-6xl font-bold uppercase tracking-tighter mb-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                ENTER THE PYRAMID
              </h2>
              <button 
                onClick={onLaunch}
                className="px-8 py-4 border border-white text-white font-bold uppercase tracking-[0.3em] text-xs hover:bg-[#0088ff] hover:border-[#0088ff] hover:text-white transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,136,255,0.4)]"
              >
                Launch Devnet App
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}
