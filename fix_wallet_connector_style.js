const fs = require('fs');
const file = 'apps/web/components/WalletConnector.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `  return (
    <div className="relative group/wallet inline-block">
      {/* HUD Border Box */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/20 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:bg-white/10 group-hover/wallet:border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
      
      {/* Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3" />

      {/* Wrapping the connector, trying to strip out default button BG via styles to let HUD shine through */}
      <div className="relative z-10 p-[1px]">
        <xrpl-wallet-connector
          ref={walletConnectorRef}
          id="wallet-connector"
          style={{
             ...THEMES[currentTheme],
            "--xc-font-family": "'Courier New', Courier, monospace",
            "--xc-border-radius": "0px",
            "--xc-modal-box-shadow": "8px 8px 0 rgba(255, 255, 255, 0.2)",
            opacity: 0.9,
          }}
          primary-wallet="xaman"
        />
      </div>
    </div>
  );`;

const newStr = `  return (
    <div className="relative group/wallet inline-block">
      {/* HUD Border Box */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:bg-white/10 group-hover/wallet:border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" />
      
      {/* Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/60" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/60" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/60" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 z-0 pointer-events-none transition-all duration-300 group-hover/wallet:w-3 group-hover/wallet:h-3 group-hover/wallet:border-white/60" />

      {/* Wrapping the connector, trying to strip out default button BG via styles to let HUD shine through */}
      <div className="relative z-10 p-[1px]">
        <xrpl-wallet-connector
          ref={walletConnectorRef}
          id="wallet-connector"
          style={{
             ...THEMES[currentTheme],
            "--xc-font-family": "ui-monospace, 'SF Mono', Monaco, Menlo, monospace",
            "--xc-border-radius": "0px",
            "--xc-modal-box-shadow": "8px 8px 0 rgba(255, 255, 255, 0.1)",
            opacity: 0.9,
          }}
          primary-wallet="xaman"
        />
      </div>
    </div>
  );`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
