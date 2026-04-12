const fs = require('fs');
const file = 'apps/web/app/page.js';
let content = fs.readFileSync(file, 'utf8');

// Replace TabsList usage to support framer motion
const oldTabsList = `  const tabsNode = (
    <TabsList className="bg-transparent border-none p-0 h-auto rounded-none w-full max-w-2xl flex justify-between gap-2">
      <TabsTrigger 
        value="dashboard" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none px-4 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
      >
        [01] Dashboard
      </TabsTrigger>
      <TabsTrigger 
        value="lending" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none px-4 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
      >
        [02] Lending
      </TabsTrigger>
      <TabsTrigger 
        value="trading" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-none px-4 py-4 text-xs font-mono uppercase tracking-widest text-white/50"
      >
        [03] ZK Trade
      </TabsTrigger>
    </TabsList>
  );`;

const newTabsList = `  const [activeTab, setActiveTab] = useState("dashboard");

  const tabsNode = (
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

content = content.replace(oldTabsList, newTabsList);

// Now update the Tabs component to use value/onValueChange
const oldTabsProps = `<Tabs defaultValue="dashboard" className="w-full flex-1 flex flex-col pt-20 md:pt-24">`;
const newTabsProps = `<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col pt-20 md:pt-24">`;

content = content.replace(oldTabsProps, newTabsProps);

fs.writeFileSync(file, content);
