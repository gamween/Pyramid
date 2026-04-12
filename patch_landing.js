const fs = require('fs');

const data = fs.readFileSync('apps/web/components/LandingPresentation.js', 'utf8');

let newContent = data;

// 1. Inject import
if (!newContent.includes('import TechStats from "./TechStats"')) {
    newContent = newContent.replace(
        'import Waves from "./Waves";',
        'import Waves from "./Waves";\nimport TechStats from "./TechStats";'
    );
}

// 2. Replace grid with TechStats component
const startMarker = '{/* Tech Stats - Monolithic Serious Effect */}';
const endMarker = '          </motion.div>\n\n        </div>';

const startIndex = newContent.indexOf(startMarker);
const endIndex = newContent.indexOf(endMarker, startIndex) + endMarker.length - 15; // To keep the closing </div> wrapper

if (startIndex !== -1) {
    const section = newContent.substring(startIndex, newContent.indexOf('        </div>\n      </div>\n    </>', startIndex));
    newContent = newContent.replace(section, '{/* Tech Stats - Monolithic Serious Effect */}\n          <TechStats />\n\n        </div>');
}

fs.writeFileSync('apps/web/components/LandingPresentation.js', newContent);
