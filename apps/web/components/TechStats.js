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
    { label: "NETWORK", val: "DEVNET", accent: "text-white", col: "md:border-r border-b md:border-b-0", delay: 0 },
    { label: "LATENCY", val: "~300MS", accent: "text-[#00b8ff] drop-shadow-[0_0_8px_rgba(0,184,255,0.5)]", col: "md:border-r border-b md:border-b-0", delay: 0.15 },
    { label: "SMART CONTRACTS", val: "ZERO", accent: "text-white", col: "md:border-r border-b border-r-0 md:border-b-0", delay: 0.3 },
    { label: "ZKP SYSTEM", val: "RISC0 ZKVM", accent: "text-[#00b8ff] drop-shadow-[0_0_8px_rgba(0,184,255,0.5)]", col: "", delay: 0.45 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="mt-40 relative group"
    >
      <div 
         ref={containerRef}
         onMouseMove={handleMouseMove}
         onMouseEnter={() => setIsHovering(true)}
         onMouseLeave={() => setIsHovering(false)}
         className="grid grid-cols-2 md:grid-cols-4 border border-white/20 bg-[#02040a]/80 backdrop-blur-xl relative overflow-hidden"
      >
         {/* Global Spotlight Overlay - Follows Cursor */}
         <div 
            className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
            style={{
              opacity: isHovering ? 1 : 0,
              background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 184, 255, 0.15), transparent 40%)`
            }}
         />
         
         {/* Glossy Scanline Effect that passes through once */}
         <motion.div 
            initial={{ x: "-100%" }}
            whileInView={{ x: "200%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00b8ff]/10 to-transparent skew-x-12 w-1/2 pointer-events-none z-0" 
         />

         {stats.map((stat, i) => (
           <div 
             key={i} 
             className={`p-8 md:p-10 border-white/20 flex flex-col justify-center items-center text-center relative z-20 ${stat.col}`}
           >
             <span className="text-[10px] text-white/30 mb-3 uppercase tracking-[0.3em] font-mono transition-colors duration-500 group-hover:text-[#00b8ff]/60">
               {stat.label}
             </span>
             <ScrambleText inView={isInView} text={stat.val} delay={stat.delay} className={`text-2xl md:text-3xl font-bold tracking-widest ${stat.accent}`} />
           </div>
         ))}
      </div>
    </motion.div>
  );
}
