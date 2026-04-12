const fs = require('fs');
const file = 'apps/web/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `  const tabsNode = (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-2xl flex justify-between gap-2">
      {["dashboard", "lending", "trading"].map((tab, i) => (
        <TabsTrigger 
          key={tab}
          value={tab} 
          onClick={() => setActiveTab(tab)}
          className="relative rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none hover:bg-transparent hover:text-white px-4 py-4 text-xs font-mono uppercase tracking-widest text-white/50 transition-colors"
        >
          [{String(i + 1).padStart(2, "0")}] {tab.replace("-", " ")}
          
          {activeTab === tab && (
            <motion.div 
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );`;

const newStr = `  const tabsNode = (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-2xl flex justify-between gap-1 md:gap-4 relative mt-2 group">
      {/* Background track for all tabs */}
      <div className="absolute inset-0 bg-[#02040a]/40 border border-white/5 pointer-events-none" />
      
      {["dashboard", "lending", "trading"].map((tab, i) => {
        const isActive = activeTab === tab;
        return (
          <TabsTrigger 
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
            
            {/* The Animated "Target Lock" HUD Box */}
            {isActive && (
              <motion.div 
                layoutId="tab-hud-box"
                className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              >
                {/* 4 Cyber/HUD Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
                
                {/* Scanning line effect */}
                <motion.div 
                  initial={{ y: "0%" }}
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[1px] bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)] pointer-events-none"
                />
              </motion.div>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
