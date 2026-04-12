const fs = require('fs');
const file = 'apps/web/components/LandingPresentation.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `  const features = [
    {
      id: "01",
      title: "LIQUIDITY VAULTS",
      protocol: "XLS-65",
      desc: "Earn organic single-sided yield directly on the XRPL. Zero smart contract risk. Stake XRP and mint MPToken LP shares natively.",
      activeBg: "bg-[#0a0502] shadow-[inset_0_0_100px_rgba(245,158,11,0.05)] border-amber-500/30"
    },
    {
      id: "02",
      title: "DEBT POSITIONS",
      protocol: "XLS-66",
      desc: "Borrow assets instantly against your Vault collateral. Manage overcollateralized debt natively through Escrows and cross-currency offers.",
      activeBg: "bg-[#02050a] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)] border-blue-500/30"
    },
    {
      id: "03",
      title: "ZK-PRIVACY",
      protocol: "GROTH5",
      desc: "Execute Advanced Stop-Loss & Take-Profit orders while keeping your trigger prices hidden on-chain. Powered by RISC0 zkVM.",
      activeBg: "bg-[#020a05] shadow-[inset_0_0_100px_rgba(16,185,129,0.05)] border-emerald-500/30"
    }
  ];`;

const newStr = `  const features = [
    {
      id: "01",
      title: "LIQUIDITY VAULTS",
      protocol: "XLS-65",
      desc: "Earn organic single-sided yield directly on the XRPL. Zero smart contract risk. Stake XRP and mint MPToken LP shares natively.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    },
    {
      id: "02",
      title: "DEBT POSITIONS",
      protocol: "XLS-66",
      desc: "Borrow assets instantly against your Vault collateral. Manage overcollateralized debt natively through Escrows and cross-currency offers.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    },
    {
      id: "03",
      title: "ZK-PRIVACY",
      protocol: "GROTH5",
      desc: "Execute Advanced Stop-Loss & Take-Profit orders while keeping your trigger prices hidden on-chain. Powered by RISC0 zkVM.",
      activeBg: "bg-white/[0.02] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-white/20"
    }
  ];`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
