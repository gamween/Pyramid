const fs = require('fs');
const path = require('path');

const pageFile = path.join('apps', 'web', 'app', 'page.js');
let content = fs.readFileSync(pageFile, 'utf-8');

if (!content.includes('LandingPresentation')) {
    content = content.replace(
        'import { ProtocolStats } from "../components/ProtocolStats";',
        'import { ProtocolStats } from "../components/ProtocolStats";\nimport { LandingPresentation } from "../components/LandingPresentation";'
    );

    content = content.replace(
        '          </p>\n        </div>\n\n        \n        </>',
        '          </p>\n        </div>\n\n        <LandingPresentation />\n        </>'
    );

    fs.writeFileSync(pageFile, content);
    console.log("Updated page.js with LandingPresentation");
} else {
    console.log("LandingPresentation already imported");
}
