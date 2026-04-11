"use client";

import { motion } from "framer-motion";

export function PrismUI() {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Top-left text */}
      <div className="absolute top-8 left-8">
        <p
          className="text-white/80 text-xs font-light tracking-[0.35em] uppercase leading-relaxed"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
        >
          EXPLORE
          <br />
          INTERACTIVE
          <br />
          LIGHT
        </p>
      </div>

      {/* Bottom-center scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-lg">&#x2039;</span>
          <p
            className="text-white/50 text-[11px] font-light tracking-[0.4em] uppercase"
            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
          >
            SCROLL TO DISCOVER
          </p>
          <span className="text-white/40 text-lg">&#x203A;</span>
        </div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/40"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>

      {/* Decorative sparkle bottom-right */}
      <div className="absolute bottom-12 right-8">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-white/20"
        >
          <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5Z" />
        </svg>
      </div>

      {/* Top-left hamburger icon */}
      <div className="absolute top-8 right-8">
        <div className="flex flex-col gap-1.5">
          <div className="w-5 h-[1px] bg-white/40"></div>
          <div className="w-5 h-[1px] bg-white/40"></div>
          <div className="w-3 h-[1px] bg-white/40"></div>
        </div>
      </div>
    </div>
  );
}
