const fs = require('fs');
const file = 'apps/web/components/LandingPresentation.js';
let content = fs.readFileSync(file, 'utf8');

// Insert import
if (!content.includes('import Waves')) {
    content = content.replace('import FeatureShowcase from "./FeatureShowcase";', 'import FeatureShowcase from "./FeatureShowcase";\nimport Waves from "./Waves";\n');
}

// Modify rendering
const oldStr = `      {/* Brutalist Architecture Rows - Interactive Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col w-full mt-24 shadow-2xl"
          >
            <FeatureShowcase features={features} onLaunch={onLaunch} />
          </motion.div>`;

const newStr = `      {/* Brutalist Architecture Rows - Interactive Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col w-full mt-24 shadow-2xl relative"
          >
            <div className="absolute inset-x-0 -top-40 bottom-0 pointer-events-none z-0" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
              <Waves
                lineColor="rgba(255, 255, 255, 0.05)"
                backgroundColor="transparent"
                waveSpeedX={0.0125}
                waveSpeedY={0.01}
                waveAmpX={40}
                waveAmpY={20}
                friction={0.9}
                tension={0.01}
                maxCursorMove={120}
                xGap={12}
                yGap={36}
              />
            </div>
            <div className="relative z-10 w-full">
              <FeatureShowcase features={features} onLaunch={onLaunch} />
            </div>
          </motion.div>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
