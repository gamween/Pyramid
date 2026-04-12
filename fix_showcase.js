const fs = require('fs');
const file = 'apps/web/components/FeatureShowcase.js';

const content = `"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function FeatureShowcase({ features }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col w-full border-t border-white/20">
      {features.map((item, i) => {
        const isActive = activeIndex === i;
        
        return (
          <motion.div
            key={item.id}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => setActiveIndex(i)}
            layout
            className={\`group relative flex flex-col border-b border-white/20 overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] \${
              isActive ? (item.activeBg || "bg-[#050a14]") : "bg-[#02040a]/40 hover:bg-[#050a14]/30"
            }\`}
          >
            <div className="p-8 md:p-10 flex flex-col md:flex-row relative z-10 w-full justify-between items-start md:items-center">
              
              {/* Left Side: Number & Titles */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                <motion.span 
                  layout 
                  className={\`font-bold transition-colors duration-700 font-mono flex-shrink-0 \${isActive ? "text-6xl md:text-7xl text-white/30" : "text-5xl md:text-6xl text-white/5"}\`}
                  style={{ fontFamily: "'Bitcount Grid', monospace" }}
                >
                  {item.id}
                </motion.span>
                
                <motion.div layout className="flex flex-col items-start">
                  <h3 className={\`text-xl md:text-3xl font-bold uppercase tracking-widest mb-3 transition-colors duration-500 \${isActive ? "text-white" : "text-white/30"}\`}>
                    {item.title}
                  </h3>
                  <span className={\`text-xs px-3 py-1.5 border inline-block font-mono tracking-widest transition-colors duration-500 \${isActive ? "text-white/80 bg-white/10 border-white/20" : "text-white/30 bg-transparent border-white/10"}\`}>
                    {item.protocol}
                  </span>
                </motion.div>
              </div>

              {/* Arrow when closed */}
              {!isActive && (
                <ArrowRight className="h-6 w-6 text-white/10 hidden md:block flex-shrink-0 transition-transform group-hover:translate-x-2 group-hover:text-white/30" />
              )}
            </div>

            {/* Body description expands underneath */}
            <div 
              className={\`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] w-full \${
                isActive ? "opacity-100 max-h-[500px] pb-8 md:pb-12" : "opacity-0 max-h-0 pb-0"
              }\`}
            >
              <div className="px-8 md:px-10 md:ml-[110px]">
                <div className="border-l border-white/10 pl-6">
                  <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-2xl font-mono mb-8">
                    {item.desc}
                  </p>
                  <button className="flex items-center gap-3 text-white font-mono text-xs uppercase tracking-widest group-hover:gap-5 transition-all">
                    <span>Explore Protocol</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  );
}
`;

fs.writeFileSync(file, content);
console.log('Update successful');
