# Pyramid

Lending-first DeFi protocol built entirely on XRPL's native primitives. Built at [PBW Hackathon 2026](https://github.com/XRPL-Commons/2026-PBW-Hackathon) by **DeVinci Blockchain** (Paris), three hackers, 36 hours: [Sofiane Ben Taleb](https://github.com/gamween), [Florian Gallot](https://github.com/bilfrux) and [Mehdi Tazi](https://github.com/MehdiMtazi).

---

## The Problem

In early 2026, XRPL introduced the **Native Lending Protocol** through two new amendment standards: **XLS-65** (Single-Asset Vaults) and **XLS-66** (On-Chain Lending). These are first-class ledger primitives, meaning vaults and loans are handled directly by the XRPL consensus layer, not by smart contracts or sidechains. This is a fundamentally different approach to DeFi: the ledger itself becomes the protocol.

Yet no one has built a complete financial product on top of these primitives. The XRPL DEX still only supports basic limit orders, with no way to set a stop-loss or automate a DCA strategy. And all trading activity is fully transparent, making strategies vulnerable to front-running.

The building blocks exist. The product doesn't.

## The Solution

**Pyramid** is the first protocol to leverage XRPL's Native Lending Protocol (XLS-65/66) and compose it with the chain's existing primitives (Escrows, DEX Offers, Smart Escrows) into a complete lending + trading + privacy platform.

**Everything is native.** There are no smart contracts, no Hooks, no off-chain order books. Every single operation that Pyramid performs is a native XRPL transaction type, processed directly by the ledger's consensus engine:

- **Lend & Earn** : Deposit XRP or RLUSD into a native Vault (`VaultDeposit`). Yield comes from borrower interest, calculated and distributed by the ledger itself.
- **Borrow** : Take a loan against vault collateral (`LoanSet`). The browser starts the flow, and the watcher signs and submits the XLS-66 transaction server-side because browser wallets cannot sign it. Interest accrual, collateral tracking, and liquidation are all handled natively by the XRPL lending protocol.
- **Advanced Trading** : Place Stop-Loss, Take-Profit, Trailing Stop, and OCO orders. Each order is an `EscrowCreate` with a crypto-condition. The app proxies the order to the watcher service, which monitors `book_offers` and executes automatically when the price condition is met. The supported surface is SELL-side only.
- **Scheduled Trading** : The watcher still contains parked scheduler code for a later redesign, but the app does not currently expose user-creatable DCA/TWAP flows.
- **ZK-Private Orders** : Hide your trigger price and trade amount on-chain using Smart Escrows (XLS-0100). A RISC0 zkVM proof (Groth16) verifies that the price condition was met without revealing it. The proof is generated via the Boundless Market and verified natively by the ledger.

We did not build a layer on top of XRPL. We composed the chain's own transaction types into a product.

## Links

- **GitHub Repository**: https://github.com/DVB-ESILV/Pyramid
- **Live App**: https://pyramid-web.vercel.app/
- **Video Demo**: https://youtu.be/5LYctLnQ9tI

## How It Works

```
User (Xaman / Crossmark / GemWallet / Otsu / WalletConnect)
   |
   v  Connect wallet
Frontend (Next.js 16.1.6)
   |
   v  App API routes (/api/orders, /api/orders/:owner/:sequence)
   |
   v
Watcher Bot (Node.js)
   |-- Monitors book_offers for live prices
   |-- Triggers orders when conditions met
   '-- Fulfills escrow crypto-conditions
   |
   v
Ledger
```

1. User deposits XRP/RLUSD into a native Vault and starts earning yield immediately
2. User borrows against their collateral through the lending flow
3. User places an advanced SELL-side order (SL/TP/Trailing/OCO). An Escrow locks the funds with a crypto-condition
4. The app proxies supported order details to the watcher through `/api/orders`
5. The Watcher Bot monitors `book_offers` on the DEX for real-time prices
6. When a trigger condition is met, the bot fulfills the Escrow and executes the trade via `OfferCreate`
7. For private orders, a Smart Escrow hides the parameters on-chain. A RISC0 ZK proof verifies the condition without revealing it

## Why Native Matters

Most DeFi protocols deploy smart contracts on top of a blockchain. Pyramid takes the opposite approach: **every operation maps directly to a built-in XRPL transaction type**.

This matters because:

- **No smart contract risk.** There is no custom bytecode to audit or exploit. The logic lives in the ledger itself, battle-tested by the XRPL validator network.
- **No gas overhead.** Native transactions cost the standard XRPL fee (fractions of a cent). No EVM execution costs, no gas bidding wars.
- **Atomic settlement.** Offers, escrows, and loans are processed by the consensus engine in a single ledger close (~3-4 seconds). No multi-step settlement, no MEV.
- **Mainnet-ready by design.** Once XLS-65/66 ship to Mainnet, Pyramid's lending layer works with zero code changes. Same transaction types, same fields, same flow.

Pyramid uses native XRPL transaction types across three layers:

| Feature | Primitive | What It Does |
|---------|-----------|--------------|
| **Native Vaults** (XLS-65) | `VaultCreate`, `VaultDeposit`, `VaultWithdraw` | Deposit assets into ledger-native vaults. Yield is distributed automatically from borrower interest. |
| **Native Lending** (XLS-66) | `LoanBrokerSet`, `LoanSet`, `LoanPay`, `LoanManage` | On-chain loans with native interest accrual, collateral tracking, and liquidation. |
| **Escrow** | `EscrowCreate`, `EscrowFinish`, `EscrowCancel` | Lock funds with crypto-conditions for advanced orders (SL, TP, Trailing, OCO). |
| **Native DEX** | `OfferCreate` (`tfImmediateOrCancel`) | Execute SELL-side market orders directly on the XRPL order book. |
| **Smart Escrows** (XLS-0100) | `EscrowCreate` with `FinishFunction` | ZK-private orders: the trigger price and amount are hidden on-chain, verified by a Groth16 proof. |
| **DEX Price Feed** | `book_offers`, `amm_info` | Real-time on-chain price discovery from the native DEX and AMM. No external oracle. |
| **Multi-Purpose Tokens** | MPToken ledger entries | Track vault shares and handle RLUSD (MPT-issued stablecoin). |

## Scaling Beyond the Hackathon

### Path to Production

Pyramid is built on primitives that are shipping to XRPL Mainnet. The lending layer (XLS-65/66) is currently live on WASM Devnet. Once it reaches Mainnet (expected Q2-Q3 2026), Pyramid's entire lending flow works in production with zero code changes. The trading layer (Escrows + DEX Offers) already works on Mainnet today.

The protocol creates a **flywheel effect** that drives organic adoption:

```
Depositors --> Vaults (earn yield)
    |
    v
Borrowers --> loans --> trade with advanced orders
    |
    v
Trading --> volume --> deeper liquidity --> more depositors
```

Each layer reinforces the others. More vault deposits enable more loans, more loans enable more trading, more trading deepens liquidity and generates more yield for depositors.

### Transaction Volume Potential

Every user action in Pyramid is an on-chain XRPL transaction:

- **Lending lifecycle:** A single user depositing, borrowing, repaying, and withdrawing generates 4+ transactions.
- **Trading:** Each advanced order creates 2-3 transactions (`EscrowCreate` + `EscrowFinish` + `OfferCreate`). Active traders could generate 10-50 transactions per day.
- **Scheduled trading:** Scheduler internals remain parked in the watcher, but creating DCA/TWAP plans is disabled in the app until a safe stop/refund lifecycle exists.
- **At scale:** With 1,000 active users running a mix of lending and trading, Pyramid could generate **50,000 to 100,000 transactions per day** on XRPL, all native, all on-ledger, all paying standard network fees.

### Roadmap

| Phase | Milestone |
|-------|-----------|
| **Now** | Hackathon demo on WASM Devnet |
| **Q2 2026** | Lending layer goes live when XLS-65/66 reach Mainnet |
| **Q3 2026** | Smart Contract integration (XLS-101) to move the order engine fully on-chain |
| **Future** | Margin trading, dynamic interest rates, cross-collateral vaults |

## Architecture

```
+-----------------------------------------------+
|       Frontend (Next.js 16.1.6 + shadcn/ui)   |
|                                                |
|  useVault | useLoanMarket | useEscrow         |
|  usePrice | useWalletManager                  |
+-----------------------+-----------------------+
                        |
   App API routes (/api/orders, /api/orders/:owner/:sequence)
                        |
+-----------------------+-----------------------+
|        Watcher Bot (Node.js + Express)        |
|                                                |
|     Order Cache --> Trigger Engine --> ZK      |
|          |               |              |      |
|     book_offers     escrow finish    proofs    |
|     (live prices)                        |      |
+-----------------------+-----------------------+
                        |
                        v
                     XRPL DEX
                (OfferCreate, Escrow)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Next.js 16.1.6](https://nextjs.org/) + [React 19](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| 3D Background | [Three.js](https://threejs.org/) |
| XRPL Client | [xrpl.js](https://js.xrpl.org/) v4.5.0-smartescrow.4 |
| Wallet | [xrpl-connect](https://github.com/XRPL-Commons/xrpl-connect) (Xaman, Crossmark, GemWallet, Otsu, WalletConnect) |
| Watcher Bot | Node.js + Express |
| ZK Proofs | [RISC0 zkVM](https://www.risczero.com/) (Groth16) + [Boundless Market](https://boundless.xyz/) |
| Monorepo | [Turborepo](https://turbo.build/) + pnpm workspaces |

## Project Structure

```
Pyramid/
├── apps/
│   ├── web/                     # Next.js 16.1.6 frontend
│   │   ├── app/                 # App Router pages
│   │   ├── components/          # React components
│   │   │   ├── loans/          # Loan marketplace + modals
│   │   │   ├── three/          # Three.js 3D backgrounds
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   └── providers/      # WalletProvider context
│   │   ├── hooks/               # useVault, useLoanMarket, useEscrow, usePrice, useWalletManager
│   │   └── lib/                 # xrplClient, networks, constants
│   └── watcher/                 # Node.js watcher bot
│       └── src/                 # devnet-loop, order-cache, zk-prover
├── packages/
│   └── zkp/                     # RISC0 guest program + CLI prover
├── docs/
│   └── specs/                   # Design specification
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js >=20.9.0
- [pnpm](https://pnpm.io/) 8+

### Install

```bash
git clone https://github.com/DVB-ESILV/Pyramid.git
cd Pyramid
pnpm install
```

### Run

```bash
# Start frontend + watcher
pnpm dev

# App available at http://localhost:3000
```

### Connect & Test

1. Click **Connect Wallet** and choose Xaman, Crossmark, GemWallet, Otsu, or WalletConnect
2. Fund your account with test XRP from the [WASM Devnet faucet](https://wasmfaucet.devnet.rippletest.net/accounts)
3. **Deposit** into a Vault to start earning yield
4. **Borrow** against your collateral
5. **Place a Stop-Loss** so the Watcher Bot monitors prices and executes automatically
6. **Optional note**: scheduled DCA/TWAP creation is currently disabled in the app while its lifecycle is being redesigned

## On-Chain Proof — Nothing Is Mocked

Every transaction Pyramid executes is a real, validated XRPL transaction on the WASM Devnet. You can verify everything on the [WASM Devnet Explorer](https://custom.xrpl.org/wasm.devnet.rippletest.net).

### Accounts

| Role | Address | Explorer |
|------|---------|----------|
| **Vault Owner (Broker)** | `rD23UrNGyZYdmYD8J5QHYVWoQgKm2yrEKD` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/rD23UrNGyZYdmYD8J5QHYVWoQgKm2yrEKD) |
| **Borrower** | `rPzZ6FYTDu8eWMP3NVbfxLQmXmqp5NwVFv` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/rPzZ6FYTDu8eWMP3NVbfxLQmXmqp5NwVFv) |
| **Watcher Bot** | `rJMcmkMxWYXae6wKy3iQVx6v9gN7p2BRFZ` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/rJMcmkMxWYXae6wKy3iQVx6v9gN7p2BRFZ) |

### Vaults (XLS-65)

| Vault | Ledger ID | Explorer |
|-------|-----------|----------|
| **Fresh Vault** (50 XRP deposited) | `8A84591D...E109C62E` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/8A84591D49EF8D1A25ABF2CE1E28DE5AA8899484392EFEDE84FA3304E109C62E) |
| **Active Lending** (80 XRP, active loan) | `6087666E...D36C66E2` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/6087666E82509EFA5922ED57E87E647A78063378686195620F6445B0D36C66E2) |
| **Yield Earned** (50 XRP, full lifecycle) | `AD7E1DB3...BA53C8A4` | [View](https://custom.xrpl.org/wasm.devnet.rippletest.net/accounts/AD7E1DB393F73284E52F90C8B960FB8FC051399521E7FC9BAE30FFCBA53C8A44) |

### Loan Brokers (XLS-66)

| Broker | Ledger ID |
|--------|-----------|
| Fresh Vault Broker | `D3DDC472215038795DB31E12BBF1274847AC4A06BF3175BED25B24AE317F0256` |
| Active Lending Broker | `1C767A5D27DA709451EFD264A17717BD78144CA73A4939DABB2C9BD872BCB47F` |
| Yield Earned Broker | `613A9F5C12DF3D44CE85E2924E778B30AE6BD65424D7050C17161365E6ED4B7F` |

### Sample Transactions

Check the borrower account (`rPzZ6FYTDu8eWMP3NVbfxLQmXmqp5NwVFv`) on the explorer to see real `LoanSet`, `LoanPay`, and `LoanManage` transactions executed through the watcher-managed lending flow during the hackathon.

**What you'll find:**
- `VaultCreate` / `VaultDeposit` — vaults created with real XRP
- `LoanBrokerSet` / `LoanBrokerCoverDeposit` — brokers configured on-chain
- `LoanSet` — real XLS-66 loan transactions signed and submitted by the watcher
- `LoanPay` — real loan repayments with interest
- `LoanManage` — broker management actions

## Network

| | |
|---|---|
| **Network** | WASM Devnet |
| **WebSocket** | `wss://wasm.devnet.rippletest.net:51233` |
| **Network ID** | 2002 |
| **Faucet** | https://wasmfaucet.devnet.rippletest.net/accounts |
| **Explorer** | https://custom.xrpl.org/wasm.devnet.rippletest.net |


## Troubleshooting

**Wallet Not Detected** — Make sure you have the wallet extension installed and unlocked.

**Transaction Failed** — Check you have sufficient XRP balance, verify you're on **WASM Devnet** (not Testnet), and try refreshing your balance.

**Build Errors** — Clean and reinstall:
```bash
pnpm clean
rm -rf node_modules
pnpm install
```

## License

MIT
