const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

// Ensure useState is imported
if (!page.includes('useState')) {
    page = page.replace(
        '"use client";',
        '"use client";\n\nimport { useState } from "react";'
    );
}

// Replace the start of Home component and logic
page = page.replace(
    'export default function Home() {\n  return (',
    `export default function Home() {
  const [isAppLaunched, setIsAppLaunched] = useState(false);

  const tabsNode = (
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
  );

  return (`
);

// Replace Header with Tabs wrapping
page = page.replace(
    '<div className="relative z-20 flex flex-col min-h-screen">\n        <Header />',
    '<div className="relative z-20 flex flex-col min-h-screen">\n        <Tabs defaultValue="dashboard" className="w-full flex-1 flex flex-col pt-20 md:pt-24">\n          <Header isAppLaunched={isAppLaunched} onLaunch={() => setIsAppLaunched(true)} tabsNode={tabsNode} />'
);

// Conditionally render Hero vs Main
const heroToMainRegex = /\{\/\* Hero Section \*\/\}([\s\S]*?)\{\/\* App Dashboard[^\n]*\n[^\n]*<main className="flex-1 w-full z-20 mt-12 px-4 md:px-12">\n\s*<div className="max-w-7xl mx-auto pb-12">[\s\S]*?<Tabs defaultValue="dashboard" className="w-full">[\s\S]*?<div className="flex justify-center mb-12">[\s\S]*?<\/div>\n\n\s*\{\/\* DASHBOARD TAB \*\/\}/;

page = page.replace(heroToMainRegex, (match, heroContent) => {
    return `{!isAppLaunched ? (
          \n          {/* Hero Section */} ${heroContent}
        ) : (
          <main className="flex-1 w-full z-20 mt-8 px-4 md:px-12 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto pb-12">
              
              {/* DASHBOARD TAB */}`;
});

// Close the tabs component at the end
page = page.replace(
    '            </Tabs>\n          </div>\n        </main>\n      </div>\n    </div>',
    '          </div>\n        </main>\n        )} \n        </Tabs>\n      </div>\n    </div>'
);

fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
console.log('Successfully refactored page.js into Landing + App Mode');
