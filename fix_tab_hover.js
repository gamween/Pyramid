const fs = require('fs');
const file = 'apps/web/components/AdvancedTradingForm.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="sl" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">SL</TabsTrigger>
            <TabsTrigger value="tp" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">TP</TabsTrigger>
            <TabsTrigger value="trailing" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">Trailing</TabsTrigger>
            <TabsTrigger value="oco" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">OCO</TabsTrigger>
            <TabsTrigger value="dca" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">DCA</TabsTrigger>
            <TabsTrigger value="twap" className="rounded-none font-mono text-xs hover:bg-white/10 data-[state=active]:bg-white data-[state=active]:text-black">TWAP</TabsTrigger>
          </TabsList>`;

const newStr = `          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 rounded-none bg-white/5">
            <TabsTrigger value="sl" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">SL</TabsTrigger>
            <TabsTrigger value="tp" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">TP</TabsTrigger>
            <TabsTrigger value="trailing" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">Trailing</TabsTrigger>
            <TabsTrigger value="oco" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">OCO</TabsTrigger>
            <TabsTrigger value="dca" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">DCA</TabsTrigger>
            <TabsTrigger value="twap" className="rounded-none font-mono text-xs hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-black transition-colors">TWAP</TabsTrigger>
          </TabsList>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
