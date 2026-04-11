const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

// Ensure import
if (!page.includes('ZkPrivacy')) {
    page = page.replace(
        'import { ProtocolStats } from "../components/ProtocolStats";',
        'import { ProtocolStats } from "../components/ProtocolStats";\nimport { ZkPrivacy } from "../components/ZkPrivacy";'
    );
}

// Target the block for ZK Privacy
const targetRegex = /<div className="p-8 relative">[\s\S]*?<div className="mx-auto h-16 w-16 border border-slate-500 bg-black flex items-center justify-center mb-6">[\s\S]*?<span className="font-mono text-xl font-bold text-slate-400">ZK<\/span>[\s\S]*?<\/div>[\s\S]*?<h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Groth5 Privacy<\/h3>[\s\S]*?<p className="text-white\/60 mb-8 font-mono text-sm max-w-sm mx-auto leading-relaxed">[\s\S]*?Prices are hidden off-chain via RISC0 ZK proofs and verified on-chain via WASM Smart Escrows \(XLS-0100\)\.[\s\S]*?<\/p>[\s\S]*?<button className="bg-white hover:bg-gray-200 text-black py-3 px-8 font-bold font-mono text-sm uppercase tracking-widest transition-all duration-300">[\s\S]*?Activate ZK-Snarks[\s\S]*?<\/button>[\s\S]*?<\/div>/;

if (targetRegex.test(page)) {
    page = page.replace(
        targetRegex,
        `<div className="p-6 relative flex flex-col justify-center h-full">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-10 w-10 border border-slate-500 bg-black flex items-center justify-center">
                          <span className="font-mono text-sm font-bold text-slate-400">ZK</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Groth5 Privacy</h3>
                      </div>
                      <ZkPrivacy />
                    </div>`
    );
    
    fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
    console.log('Successfully injected ZkPrivacy into page.js');
} else {
    console.log('Could not find the exact Groth5 Privacy block to replace. Check regex.');
}
