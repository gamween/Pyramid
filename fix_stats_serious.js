const fs = require('fs');
const file = 'apps/web/components/LandingPresentation.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          {/* Tech Stats - Animated HUD style */}
          <div className="mt-40 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "NETWORK", val: "DEVNET", pulse: "bg-emerald-500", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50" },
              { label: "LATENCY", val: "~300ms", accent: "text-emerald-400", glow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:border-emerald-400/50" },
              { label: "SMART CONTRACTS", val: "ZERO", accent: "text-red-500", glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/50" },
              { label: "ZKP SYSTEM", val: "RISC0 zkVM", glow: "hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/50" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 100 }}
                className={\`group relative p-6 md:p-8 border border-white/10 bg-[#02040a]/80 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 cursor-default \${stat.glow}\`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                  <div className="flex items-center gap-2 mb-3">
                    {stat.pulse && (
                      <span className="relative flex h-2 w-2">
                        <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 \${stat.pulse}\`}></span>
                        <span className={\`relative inline-flex rounded-full h-2 w-2 \${stat.pulse}\`}></span>
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
                  </div>
                  <span className={\`text-xl md:text-3xl font-bold tracking-widest \${stat.accent || "text-white"}\`} style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                    {stat.val}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>`;

const newStr = `          {/* Tech Stats - Monolithic Serious Effect */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mt-40 grid grid-cols-2 md:grid-cols-4 border border-white/20 bg-black/40 backdrop-blur-md relative overflow-hidden group cursor-default"
          >
            {/* Glossy Scanline Effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] skew-x-12 group-hover:animate-[scan_1.5s_ease-in-out_forwards]" />
            
            {[
              { label: "NETWORK", val: "DEVNET", col: "md:border-r border-b md:border-b-0", accent: "text-white group-hover:opacity-100 text-white/70 transition-opacity duration-500" },
              { label: "LATENCY", val: "~300ms", col: "md:border-r border-b md:border-b-0", accent: "text-emerald-400" },
              { label: "SMART CONTRACTS", val: "ZERO", col: "md:border-r border-b border-r-0 md:border-b-0", accent: "text-red-500" },
              { label: "ZKP SYSTEM", val: "RISC0 zkVM", col: "", accent: "text-white group-hover:opacity-100 text-white/70 transition-opacity duration-500" }
            ].map((stat, i) => (
              <div key={i} className={\`p-8 md:p-10 border-white/20 \${stat.col} flex flex-col justify-center items-center text-center relative overflow-hidden\`}>
                <span className="text-[10px] text-white/30 mb-2 uppercase tracking-[0.3em] z-10 transition-colors duration-500 group-hover:text-white/50">{stat.label}</span>
                
                {/* Blur reveal text on view */}
                <motion.div 
                  initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + (i * 0.15) }}
                  className="z-10"
                >
                  <span className={\`text-2xl md:text-3xl font-bold tracking-widest \${stat.accent || "text-white"}\`} style={{ fontFamily: "'Bitcount Grid', monospace" }}>
                    {stat.val}
                  </span>
                </motion.div>
              </div>
            ))}
          </motion.div>`;

content = content.replace(oldStr, newStr);

fs.writeFileSync(file, content);
console.log("Updated to Serious Tech Stats");
