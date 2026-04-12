const fs = require('fs');

let page = fs.readFileSync('apps/web/app/page.js', 'utf8');

page = page.replace('{!isAppLaunched ? (\n          \n          {/* Hero Section */} \n        <div', '{!isAppLaunched ? (\n          <>\n          {/* Hero Section */} \n        <div');

page = page.replace(') : (\n          <main className="flex-1 w-full z-20 mt-8 px-4 md:px-12 animate-in fade-in duration-700">', '</>\n        ) : (\n          <main className="flex-1 w-full z-20 mt-8 px-4 md:px-12 animate-in fade-in duration-700">');

fs.writeFileSync('apps/web/app/page.js', page, 'utf8');
console.log('Fixed JSX syntax error in page.js');
