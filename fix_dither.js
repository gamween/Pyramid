const fs = require('fs');
const path = require('path');

const file = path.join('apps', 'web', 'components', 'LandingPresentation.js');
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import Dither')) {
    content = content.replace(
        'import { useRef } from "react";',
        'import { useRef } from "react";\nimport Dither from "./Dither";'
    );

    content = content.replace(
        'const bgOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);',
        `// Black background fades in quickly (from 0 to 0.4 scroll progress out of 1)\n  const bgOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);\n  // Dither fades in AFTER background is black (from 0.4 to 1.0 scroll progress)\n  const ditherOpacity = useTransform(scrollYProgress, [0.4, 1], [0, 1]);`
    );

    content = content.replace(
        'className="fixed inset-0 bg-black z-10 pointer-events-none"\n      />',
        `className="fixed inset-0 bg-black z-10 pointer-events-none"\n      />\n\n      <motion.div\n        style={{ opacity: ditherOpacity }}\n        className="fixed inset-0 z-10 pointer-events-none"\n      >\n        <Dither \n            waveColor={[0.15, 0.15, 0.15]} \n            enableMouseInteraction={false}\n            waveSpeed={0.03}\n        />\n      </motion.div>`
    );

    fs.writeFileSync(file, content);
    console.log("Injected Dither animation");
} else {
    console.log("Already present");
}
