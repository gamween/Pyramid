const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

// Add import
if (!page.includes('LoanInteraction')) {
    page = page.replace(
        'import { AdvancedTradingForm } from "../components/AdvancedTradingForm";',
        'import { AdvancedTradingForm } from "../components/AdvancedTradingForm";\nimport { LoanInteraction } from "../components/LoanInteraction";'
    );
}

// Replace the mocked Loan component with LoanInteraction
const tokenBlockRegex = /<div className="border border-white\/20 bg-black\/40 backdrop-blur-xl flex flex-col justify-center text-center relative overflow-hidden">[\s\S]*?Request Co-Signature[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

if (tokenBlockRegex.test(page)) {
    page = page.replace(tokenBlockRegex, `<div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Loan Interface (XLS-66)</h2>
                    </div>
                    <div className="p-4">
                      <LoanInteraction />
                    </div>
                  </div>`);
    
    fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
    console.log('Successfully added LoanInteraction to page.js');
} else {
    console.log('Could not find the target block to replace.');
}
