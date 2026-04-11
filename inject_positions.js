const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

// Ensure import
if (!page.includes('ActivePositions')) {
    page = page.replace(
        'import { ZkPrivacy } from "../components/ZkPrivacy";',
        'import { ZkPrivacy } from "../components/ZkPrivacy";\nimport { ActivePositions } from "../components/ActivePositions";'
    );
}

// Target the injection point right after the TransactionForm in the Dashboard tab.
// Find:                     <div className="p-6">
//                      <TransactionForm />
//                    </div>
//                  </div>
//                </div>

const findTarget = /<div className="lg:col-span-2 border border-white\/20 bg-black\/40 backdrop-blur-xl relative">[\s\S]*?<TransactionForm \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

if (findTarget.test(page)) {
    page = page.replace(findTarget, (match) => {
        return match + '\n                <ActivePositions />';
    });
    
    fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
    console.log('Successfully injected ActivePositions into page.js');
} else {
    console.log('Could not find the exact pattern for TransactionForm injection.');
}
