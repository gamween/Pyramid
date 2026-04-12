# Pyramid

Lending-first DeFi protocol built entirely on XRPL's native primitives. Built at [PBW Hackathon 2026](https://github.com/XRPL-Commons/2026-PBW-Hackathon) by **DeVinci Blockchain** (Paris), three hackers, 36 hours: [Sofiane Ben Taleb](https://github.com/gamween), [Florian Gallot](https://github.com/bilfrux) and [Mehdi Tazi](https://github.com/MehdiMtazi).

---

## The Problem

In early 2026, XRPL introduced the **Native Lending Protocol** through two new amendment standards: **XLS-65** (Single-Asset Vaults) and **XLS-66** (On-Chain Lending). These are first-class ledger primitives, meaning vaults and loans are handled directly by the XRPL consensus layer, not by smart contracts or sidechains. This is a fundamentally different approach to DeFi: the ledger itself becomes the protocol.

Yet no one has built a complete financial product on top of these primitives. The XRPL DEX still only supports basic limit orders, with no way to set a stop-loss or automate a DCA strategy. And all trading activity is fully transparent, making strategies vulnerable to front-running.

The building blocks exist. The product doesn't.

## The Solution

**Pyramid** is the first protocol to leverage XRPL's Native Lending Protocol (XLS-65/66) and compose it with the chain's existing primitives (Escrows, DEX Offers, Tickets, Smart Escrows) into a complete lending + trading + privacy platform.

**Everything is native.** There are no smart contracts, no Hooks, no off-chain order books. Every single operation that Pyramid performs is a native XRPL transaction type, processed directly by the ledger's consensus engine:

- **Lend & Earn** : Deposit XRP or RLUSD into a native Vault (`VaultDeposit`). Yield comes from borrower interest, calculated and distributed by the ledger itself.
- **Borrow** : Take a loan against vault collateral (`LoanSet`). Interest accrual, collateral tracking, and liquidation are all handled natively by the XRPL lending protocol.
- **Advanced Trading** : Place Stop-Loss, Take-Profit, Trailing Stop, and OCO orders. Each order is an `EscrowCreate` with a crypto-condition. A Watcher Bot monitors the native DEX via `book_offers` and executes automatically when the price condition is met.
- **DCA & TWAP** : Sign a batch of orders once using `TicketCreate` + pre-signed `OfferCreate` transactions. The bot submits them at scheduled intervals. No further user interaction needed.
- **ZK-Private Orders** : Hide your trigger price and trade amount on-chain using Smart Escrows (XLS-0100). A RISC0 zkVM proof (Groth16) verifies that the price condition was met without revealing it. The proof is generated via the Boundless Market and verified natively by the ledger.

We did not build a layer on top of XRPL. We composed the chain's own transaction types into a product.

## Links

- **GitHub Repository**:
- **Live App**:
- **Video Demo**:

## How It Works

```
User (Xaman / Crossmark / GemWallet)
   |
   v  Connect wallet
Frontend (Next.js :3000)
   |
   |-- LENDING --------------------------------+
   |   |                                       |
   |   |-- 1. VaultDeposit (XLS-65)            |
   |   |      User deposits XRP/RLUSD          |
   |   |      into a native Vault, earns yield |
   |   |                                       |
   |   '-- 2. LoanSet (XLS-66)                 |
   |          Borrow against vault collateral   |
   |          On-chain interest + liquidation   |
   |                                           |
   |-- TRADING --------------------------------+
   |   |                                       |
   |   |-- 3. EscrowCreate + crypto-condition   |
   |   |      SL / TP / Trailing / OCO order    |
   |   |                                       |
   |   '-- 4. TicketCreate + pre-signed Offers  |
   |          DCA / TWAP strategy               |
   |                                           |
   |-- PRIVACY --------------------------------+
   |   |                                       |
   |   '-- 5. Smart Escrow (XLS-0100)           |
   |          Hidden trigger price + amount      |
   |          RISC0 ZK proof via Boundless       |
   |                                           |
   v                                           |
Watcher Bot (Node.js)                          |
   |                                           |
   |-- Monitors book_offers for live prices     |
   |-- Triggers orders when conditions met      |
   |-- Executes DCA slices on schedule          |
   '-- Fulfills escrow crypto-conditions        |
```

1. User deposits XRP/RLUSD into a native Vault and starts earning yield immediately
2. User borrows against their collateral via a cosigned Loan transaction
3. User places an advanced order (SL/TP/Trailing/OCO). An Escrow locks the funds with a crypto-condition
4. The Watcher Bot monitors `book_offers` on the DEX for real-time prices
5. When a trigger condition is met, the bot fulfills the Escrow and executes the trade via `OfferCreate`
6. For DCA, the bot submits pre-signed orders at scheduled intervals using Tickets
7. For private orders, a Smart Escrow hides the parameters on-chain. A RISC0 ZK proof verifies the condition without revealing it

## Why Native Matters

Most DeFi protocols deploy smart contracts on top of a blockchain. Pyramid takes the opposite approach: **every operation maps directly to a built-in XRPL transaction type**.

This matters because:

- **No smart contract risk.** There is no custom bytecode to audit or exploit. The logic lives in the ledger itself, battle-tested by the XRPL validator network.
- **No gas overhead.** Native transactions cost the standard XRPL fee (fractions of a cent). No EVM execution costs, no gas bidding wars.
- **Atomic settlement.** Offers, escrows, and loans are processed by the consensus engine in a single ledger close (~3-4 seconds). No multi-step settlement, no MEV.
- **Mainnet-ready by design.** Once XLS-65/66 ship to Mainnet, Pyramid's lending layer works with zero code changes. Same transaction types, same fields, same flow.

Pyramid uses **10+ native XRPL transaction types** across three layers:

| Feature | Primitive | What It Does |
|---------|-----------|--------------|
| **Native Vaults** (XLS-65) | `VaultCreate`, `VaultDeposit`, `VaultWithdraw` | Deposit assets into ledger-native vaults. Yield is distributed automatically from borrower interest. |
| **Native Lending** (XLS-66) | `LoanBrokerSet`, `LoanSet`, `LoanPay`, `LoanManage` | On-chain loans with native interest accrual, collateral tracking, and liquidation. |
| **Escrow** | `EscrowCreate`, `EscrowFinish`, `EscrowCancel` | Lock funds with crypto-conditions for advanced orders (SL, TP, Trailing, OCO). |
| **Native DEX** | `OfferCreate` (`tfImmediateOrCancel`) | Execute market orders directly on the XRPL order book. |
| **Tickets** | `TicketCreate` + pre-signed `OfferCreate` | Enable DCA/TWAP by pre-authorizing a sequence of future trades. |
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
- **DCA:** A single DCA strategy with 30 daily slices generates 31 transactions (1 `TicketCreate` + 30 `OfferCreate`).
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
|       Frontend (Next.js 14 + shadcn/ui)       |
|                                                |
|  useVault | useLoan | useEscrow | usePrice    |
|  useTickets | useWallet (xrpl-connect)         |
+-----------------------+-----------------------+
                        |
          WASM Devnet   |   wss://wasm.devnet.rippletest.net:51233
                        |
+-----------------------+-----------------------+
|        Watcher Bot (Node.js + Express)        |
|                                                |
|  Devnet Loop --> Order Cache --> Trigger Engine |
|       |              |               |         |
|  book_offers    DCA Scheduler   ZK Prover      |
|  (live prices)  (cron slices)   (RISC0)        |
+--------+-------------+---------------+--------+
         |             |               |
         v             v               v
    XRPL DEX      Escrow Finish   Smart Escrow
  (OfferCreate)  (crypto-cond.)  (ZK on-chain)
                                       |
                                RISC0 zkVM
                              (Boundless Market)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Next.js 14](https://nextjs.org/) + [React 18](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| 3D Background | [Three.js](https://threejs.org/) |
| XRPL Client | [xrpl.js](https://js.xrpl.org/) v4.5.0-smartescrow.4 |
| Wallet | [xrpl-connect](https://github.com/XRPL-Commons/xrpl-connect) (Xaman, Crossmark, GemWallet) |
| Watcher Bot | Node.js + Express |
| ZK Proofs | [RISC0 zkVM](https://www.risczero.com/) (Groth16) + [Boundless Market](https://boundless.xyz/) |
| Monorepo | [Turborepo](https://turbo.build/) + pnpm workspaces |

## Project Structure

```
Pyramid/
├── apps/
│   ├── web/                     # Next.js 14 frontend
│   │   ├── app/                 # App Router pages
│   │   ├── components/          # React components
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── three/          # Three.js 3D background
│   │   │   └── providers/      # WalletProvider context
│   │   ├── hooks/               # useVault, useLoan, useEscrow, useTickets, usePrice
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

## Getting Started

### Prerequisites

- Node.js 18+
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

1. Click **Connect Wallet** and choose Xaman, Crossmark, or GemWallet
2. Fund your account with test XRP from the [WASM Devnet faucet](https://wasmfaucet.devnet.rippletest.net/accounts)
3. **Deposit** into a Vault to start earning yield
4. **Borrow** against your collateral
5. **Place a Stop-Loss** so the Watcher Bot monitors prices and executes automatically
6. **Set up a DCA**: sign once, the bot handles the rest

## Network

| | |
|---|---|
| **Network** | WASM Devnet |
| **WebSocket** | `wss://wasm.devnet.rippletest.net:51233` |
| **Network ID** | 2002 |
| **Faucet** | https://wasmfaucet.devnet.rippletest.net/accounts |
| **Explorer** | https://devnet.xrpl.org |


## License

MIT
