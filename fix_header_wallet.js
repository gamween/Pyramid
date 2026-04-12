const fs = require('fs');
let code = fs.readFileSync('apps/web/components/Header.js', 'utf8');

const regex = /\{!isAppLaunched \? \([\s\S]*?Launch App[\s\S]*?<\/button>\n\s*\) : \([\s\S]*?<WalletConnector \/>\n\s*\)\}/;

if (regex.test(code)) {
    code = code.replace(regex, `{!isAppLaunched && (
            <button 
              onClick={onLaunch}
              className="border border-white/50 bg-black/50 hover:bg-white hover:text-black text-white font-mono px-6 py-3 tracking-widest text-sm uppercase transition-all duration-300"
            >
              Launch App
            </button>
          )}
          <div className={!isAppLaunched ? "hidden" : "block"}>
            <WalletConnector />
          </div>`);
    
    fs.writeFileSync('apps/web/components/Header.js', code, 'utf8');
    console.log('Fixed WalletConnector mounting issue in Header.js');
} else {
    console.log('Regex failed.');
}
