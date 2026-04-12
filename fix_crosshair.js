const fs = require('fs');
const path = require('path');

const pageFile = path.join('apps', 'web', 'app', 'page.js');
let content = fs.readFileSync(pageFile, 'utf-8');

if (!content.includes('<Crosshair')) {
    content = content.replace(
        '{!isAppLaunched ? (\n          <>',
        '{!isAppLaunched ? (\n          <>\n          <Crosshair color="rgba(255,255,255,0.15)" />'
    );
    fs.writeFileSync(pageFile, content);
    console.log("Injected Crosshair");
} else {
    console.log("Already present");
}
