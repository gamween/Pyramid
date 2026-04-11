# Tellement-French

First DeFi protocol built on XRPL's native lending protocol (XLS-65/66). Composes Vaults, Loans, and the native DEX into a complete trading + yield platform. No smart contracts, no Hooks — pure native XRPL primitives.

## Features

- **Lending** — Deposit into Vaults, earn yield from loan interest (XLS-65/66)
- **Borrowing** — Take loans from Vault liquidity, fixed term + rate
- **Advanced Trading** — Stop-Loss, Take-Profit, Trailing Stop, OCO via Escrow + watcher
- **DCA / TWAP** — Pre-signed orders with Tickets, auto-executed at intervals
- **ZK Privacy** — Hidden trigger prices via Smart Escrows (XLS-0100) + RISC0 proofs on Groth5
- **Multi-Wallet** — Xaman, Crossmark, GemWallet, WalletConnect, Otsu
- **Native Prices** — `book_offers` + `amm_info` from XRPL DEX/AMM (no oracle)

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tellement-french.git
cd tellement-french

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Architecture

| Layer | Network | Primitives |
|---|---|---|
| **Lending** | Devnet | VaultCreate, VaultDeposit, VaultWithdraw, LoanBrokerSet, LoanSet, LoanPay |
| **Trading** | Devnet | EscrowCreate, EscrowFinish, EscrowCancel, OfferCreate (ImmediateOrCancel) |
| **DCA/TWAP** | Devnet | TicketCreate + pre-signed OfferCreate |
| **Privacy** | Groth5 | Smart Escrows (XLS-0100) + RISC0 proofs via Boundless, verified on-chain |
| **Prices** | Devnet | book_offers + amm_info (native DEX/AMM, no oracle) |

### The Flywheel

```
Depositors → Vaults (earn yield)
    ↓
Borrowers → loans → trade with advanced orders
    ↓
Trading → volume → more depositors → deeper liquidity
```

## Project Structure

```
tellement-french/
├── apps/
│   ├── web/                     # Next.js 14 frontend
│   │   ├── app/                 # App Router pages
│   │   ├── components/          # React components (lending/, trading/, dashboard/)
│   │   ├── hooks/               # useVault, useLoan, useEscrow, useTickets, usePrice
│   │   ├── providers/           # LendingProvider, OrderProvider
│   │   └── lib/                 # xrplClient, networks, constants
│   └── watcher/                 # Node.js watcher bot
│       └── src/                 # devnet-loop, dca-scheduler, order-cache, zk-prover
├── packages/
│   └── zkp/                     # RISC0 guest program + CLI prover
├── docs/
│   └── specs/                   # Design specification
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Usage

### Connecting Your Wallet

1. Click "Connect Wallet" in the header
2. Choose your wallet (Xaman, Crossmark, GemWallet, Otsu) or WalletConnect
3. Approve the connection in your wallet

### Getting Test XRP

1. Connect your wallet on **Devnet**
2. Go to the "Faucet" section
3. Click "Request Test XRP"

### Lending

1. **Deposit** — Enter amount → VaultDeposit transaction → receive share MPTokens
2. **Borrow** — Request a loan → cosigned LoanSet transaction → receive funds
3. **Repay** — LoanPay with principal + interest

### Trading

1. **Stop-Loss / Take-Profit** — Set trigger price → EscrowCreate locks funds → watcher monitors DEX → executes when triggered
2. **DCA** — Choose amount, count, interval → TicketCreate + pre-sign N orders → watcher submits at intervals
3. **Private Orders** — Toggle "Hide trigger price (ZK)" → Smart Escrow on Groth5, RISC0 proof verified on-chain

## Networks

### Devnet (Default)
- **WebSocket:** wss://s.devnet.rippletest.net:51233
- **Network ID:** 2
- **Faucet:** https://faucet.devnet.rippletest.net/accounts
- **Explorer:** https://devnet.xrpl.org

### Groth5 (ZK Smart Escrows Only)
- **WebSocket:** wss://groth5.devnet.rippletest.net:51233
- **Faucet:** http://groth5-faucet.devnet.rippletest.net
- **Explorer:** http://custom.xrpl.org/groth5.devnet.rippletest.net
- **xrpl.js:** `4.5.0-smartescrow.4` (required for `FinishFunction` + `ComputationAllowance`)

## XRPL Transaction Types Used

- `VaultCreate`, `VaultDeposit`, `VaultWithdraw` (XLS-65 Vaults)
- `LoanBrokerSet`, `LoanSet`, `LoanPay`, `LoanManage`, `LoanDelete` (XLS-66 Lending)
- `EscrowCreate`, `EscrowFinish`, `EscrowCancel` (conditional fund locking)
- `OfferCreate` with `tfImmediateOrCancel` (DEX market orders)
- `TicketCreate` (parallel pre-signed DCA/TWAP)
- `Payment` (settlement)
- `book_offers`, `amm_info` (native price discovery)

## Development

### Available Commands

```bash
pnpm dev          # Start frontend + watcher
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm format       # Format code with Prettier
pnpm clean        # Clean build artifacts
```

### Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
# Network (default: devnet)
NEXT_PUBLIC_DEFAULT_NETWORK=devnet

# Wallet adapters (optional)
NEXT_PUBLIC_XAMAN_API_KEY=your_xaman_api_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

## Tech Stack

- [Next.js 14](https://nextjs.org/) + [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [xrpl.js v3](https://js.xrpl.org/) + [xrpl-connect](https://github.com/peerkat/xrpl-connect)
- [Turborepo](https://turbo.build/) + pnpm workspaces
- [RISC0 zkVM](https://www.risczero.com/) + [Boundless Market](https://boundless.xyz/)

## Resources

- [XRPL Documentation](https://xrpl.org/)
- [XLS-65 Vault Spec](https://github.com/XRPLF/XRPL-Standards/discussions/182)
- [XLS-66 Lending Spec](https://github.com/XRPLF/XRPL-Standards/discussions/183)
- [Design Specification](docs/specs/2026-04-11-tellement-french-design.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see LICENSE file for details
