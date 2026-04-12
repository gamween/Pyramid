"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

function ScrambleText({ text, delay, className, inView }) {
  const [display, setDisplay] = useState(text.replace(/./g, '-'));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
  
  useEffect(() => {
    if (!inView) {
        setDisplay(text.replace(/./g, '-'));
        return;
    }
    let timeout;
    let p = 0;
    
    const animate = () => {
       if (p >= text.length) {
          setDisplay(text);
          return;
       }
       let str = "";
       for (let i = 0; i < text.length; i++) {
          if (i < p) str += text[i];
          else str += letters[Math.floor(Math.random() * letters.length)];
       }
       setDisplay(str);
       p += 1 / 3;
       timeout = setTimeout(animate, 30);
    };
    
    const initialDelay = setTimeout(animate, 300 + delay * 1000);
    return () => {
       clearTimeout(timeout);
       clearTimeout(initialDelay);
    };
  }, [text, delay, inView]);

  return (
     <motion.div
       initial={{ opacity: 0, filter: "blur(10px)" }}
       animate={inView ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
       transition={{ duration: 0.5, delay }}
     >
       <span className={className} style={{ fontFamily: "'Bitcount Grid', monospace" }}>{display}</span>
     </motion.div>
  );
}

export default function TechStats() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
     if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
     }
  };

  const stats = [
    { label: "NETWORK", val: "DEVNET", accent: "text-white", delay: 0 },
    { label: "LATENCY", val: "~300MS", accent: "text-[#0088ff]", delay: 0.15 },
    { label: "SMART CONTRACTS", val: "ZERO", accent: "text-white", delay: 0.3 },
    { label: "ZKP SYSTEM", val: "RISC0", accent: "text-[#0088ff]", delay: 0.45 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1 }}
      className="mt-32 max-w-7xl mx-auto px-4 relative z-10"
    >
      <div 
         ref={containerRef}
         className="flex flex-row flex-wrap items-center justify-center gap-x-12 gap-y-8 py-8 border-y border-white/5"
      >
         {stats.map((stat, i) => (
           <div key={i} className="flex flex-col items-center justify-center group pl-4 pr-4">
             <div className="flex items-center gap-3 mb-2 md:mb-3 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                <span className="hidden md:block w-4 h-[1px] bg-gradient-to-r from-transparent to-[#0088ff]/60"></span>
                <span className="text-xs text-[#0088ff] uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono whitespace-nowrap">
                  {stat.label}
                </span>
                <span className="hidden md:block w-4 h-[1px] bg-gradient-to-l from-transparent to-[#0088ff]/60"></span>
             </div>
             <ScrambleText inView={isInView} text={stat.val} delay={stat.delay} className={`text-2xl md:text-3xl lg:text-4xl font-bold tracking-widest whitespace-nowrap ${stat.accent}`} />
           </div>
         ))}
      </div>
    </motion.div>
  );
}
