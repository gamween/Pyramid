const fs = require('fs');
const file = 'apps/web/components/LandingPresentation.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          {/* Tech Stats - Animated HUD style */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-40 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: "NETWORK", val: "DEVNET", pulse: "bg-emerald-500", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50" },
              { label: "LATENCY", val: "~300ms", accent: "text-emerald-400", glow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:border-emerald-400/50" },
              { label: "SMART CONTRACTS", val: "ZERO", accent: "text-red-500", glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/50" },
              { label: "ZKP SYSTEM", val: "RISC0 zkVM", glow: "hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/50" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 40, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
                }}
                className={\`group relative p-6 md:p-8 border border-white/10 bg-[#02040a]/80 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 cursor-default \${stat.glow}\`}
              >`;

const newStr = `          {/* Tech Stats - Animated HUD style */}
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
              >`;

content = content.replace(oldStr, newStr);

// Let's also fix the closing tags: The top wrapping div was changed from motion.div to div
content = content.replace(
`                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>`,
`                </div>
              </motion.div>
            ))}
          </div>

        </div>`
);

fs.writeFileSync(file, content);
console.log("Fixed framer variants");
