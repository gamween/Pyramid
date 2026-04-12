const fs = require('fs');
let code = fs.readFileSync('apps/web/components/Header.js', 'utf8');

code = code.replace(
  'export function Header({ isAppLaunched, onLaunch, tabsNode }) {',
  'export function Header({ isAppLaunched, onLaunch, onGoHome, tabsNode }) {'
);

code = code.replace(
  /<div className="flex items-center gap-4">([\s\S]*?)<\/div>/,
  `<button onClick={onGoHome} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity outline-none text-left">
          $1
        </button>`
);

fs.writeFileSync('apps/web/components/Header.js', code, 'utf8');
console.log('Header.js click updated!');
