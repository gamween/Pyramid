const fs = require('fs');
const file = 'apps/web/components/LandingPresentation.js';
let content = fs.readFileSync(file, 'utf8');

// I am removing the custom tailwind animation class for scan and replacing it with a standardized framer motion overlay
const badStr = `<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] skew-x-12 group-hover:animate-[scan_1.5s_ease-in-out_forwards]" />`;

const goodStr = `<motion.div 
              initial={{ x: "-100%" }}
              whileInView={{ x: "200%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 w-1/2 pointer-events-none z-0" 
            />`;

content = content.replace(badStr, goodStr);

fs.writeFileSync(file, content);
