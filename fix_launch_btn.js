const fs = require('fs');
const file = 'apps/web/components/Header.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          {!isAppLaunched && (
            <button 
              onClick={onLaunch}
              className="border border-white/50 bg-black/50 hover:bg-white hover:text-black text-white font-mono px-6 py-3 tracking-widest text-sm uppercase transition-all duration-300"
            >
              Launch App
            </button>
          )}`;

const newStr = `          {!isAppLaunched && (
            <div className="relative group/launch inline-block">
              {/* HUD Border Box */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 z-0 pointer-events-none transition-all duration-300 group-hover/launch:bg-white/10 group-hover/launch:border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
              
              {/* Corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white z-0 pointer-events-none transition-all duration-300 group-hover/launch:w-3 group-hover/launch:h-3" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white z-0 pointer-events-none transition-all duration-300 group-hover/launch:w-3 group-hover/launch:h-3" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white z-0 pointer-events-none transition-all duration-300 group-hover/launch:w-3 group-hover/launch:h-3" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white z-0 pointer-events-none transition-all duration-300 group-hover/launch:w-3 group-hover/launch:h-3" />

              <button 
                onClick={onLaunch}
                className="relative z-10 bg-transparent text-white hover:text-white font-mono px-6 py-3 tracking-[0.2em] text-xs font-bold uppercase transition-all duration-300 outline-none"
              >
                Launch App
              </button>
            </div>
          )}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
