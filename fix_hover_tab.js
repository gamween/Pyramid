const fs = require('fs');
const file = 'apps/web/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          <TabsTrigger 
            key={tab}
            value={tab} 
            onClick={() => setActiveTab(tab)}
            className={\`relative flex-1 rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white/80 py-4 px-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] transition-colors z-10 \${isActive ? "text-white" : "text-white/40"}\`}
          >
            {/* The Text Layer */}
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full">
              <span className={\`transition-colors duration-500 font-bold \${isActive ? "text-white" : "text-white/10"}\`}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span>{tab.replace("-", " ")}</span>
            </div>
            
            {/* The Animated "Target Lock" HUD Box */}`;

const newStr = `          <TabsTrigger 
            key={tab}
            value={tab} 
            onClick={() => setActiveTab(tab)}
            className={\`relative flex-1 rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white/90 py-4 px-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] transition-colors z-10 group/tab \${isActive ? "text-white" : "text-white/40"}\`}
          >
            {/* The Text Layer */}
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full">
              <span className={\`transition-colors duration-500 font-bold \${isActive ? "text-white focus:text-white" : "text-white/10 group-hover/tab:text-white/40"}\`}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span>{tab.replace("-", " ")}</span>
            </div>

            {/* Hover Teaser Box */}
            {!isActive && (
              <div className="absolute inset-0 bg-white/[0.01] border border-white/0 group-hover/tab:border-white/10 transition-all duration-300 pointer-events-none z-0 opacity-0 group-hover/tab:opacity-100">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 group-hover/tab:w-2 group-hover/tab:h-2 transition-all duration-300" />
              </div>
            )}
            
            {/* The Animated "Target Lock" HUD Box */}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
