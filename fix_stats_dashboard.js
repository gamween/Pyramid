const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

// Ensure import
if (!page.includes('ProtocolStats')) {
    page = page.replace(
        'import { AdvancedTradingForm } from "../components/AdvancedTradingForm";',
        'import { AdvancedTradingForm } from "../components/AdvancedTradingForm";\nimport { ProtocolStats } from "../components/ProtocolStats";'
    );
}

// Inject ProtocolStats into DASHBOARD TAB right before `<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">`
const targetInjection = '{/* DASHBOARD TAB */}\n              <TabsContent value="dashboard" className="animate-in fade-in duration-500">\n                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">';

if (page.includes(targetInjection)) {
    page = page.replace(
        targetInjection,
        '{/* DASHBOARD TAB */}\n              <TabsContent value="dashboard" className="animate-in fade-in duration-500">\n                <div className="mb-6">\n                  <ProtocolStats />\n                </div>\n                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">'
    );
    
    fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
    console.log('Successfully injected ProtocolStats into page.js');
} else {
    // try a more generic replacement
    const fallbackTarget = '<TabsContent value="dashboard" className="animate-in fade-in duration-500">\n                <div className="grid gap-6';
    if (page.includes(fallbackTarget)) {
         page = page.replace(
             fallbackTarget,
             '<TabsContent value="dashboard" className="animate-in fade-in duration-500">\n                <div className="mb-6">\n                  <ProtocolStats />\n                </div>\n                <div className="grid gap-6'
         );
         fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
         console.log('Successfully injected ProtocolStats into page.js (fallback method)');
    } else {
        console.log('Could not find the target block starting DASHBOARD TAB.');
    }
}
