const fs = require('fs');
const file = 'apps/web/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col h-full">
                    <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center"><h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Groth5 Privacy (ZK)</h2><span className="text-[10px] font-mono text-slate-400 bg-black px-2 py-1 border border-slate-700">RISC0</span></div><div className="p-6 relative flex flex-col justify-center h-full">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-10 w-10 border border-slate-500 bg-black flex items-center justify-center">
                          <span className="font-mono text-sm font-bold text-slate-400">ZK</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Groth5 Privacy</h3>
                      </div>
                      <ZkPrivacy />
                    </div>
                  </div>`;

const newStr = `                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col h-full">
                    <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Groth5 ZK Prover</h2>
                      <span className="text-[10px] font-mono text-slate-400 bg-black px-2 py-1 border border-slate-700">RISC0</span>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto scrollbar-none">
                      <ZkPrivacy />
                    </div>
                  </div>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
