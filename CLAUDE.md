# Tellement-French — Lending-First DeFi Protocol for XRPL

## Project Overview

First DeFi protocol built on XRPL's native lending protocol (XLS-65/66). Composes Vaults, Loans, and the native DEX into a complete trading + yield platform. No smart contracts, no Hooks — pure native XRPL primitives.

## Branch Strategy

- **`sofiane`** is the working branch.
- **`main`** must never be touched.
- Commit messages: `chore:`, `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Architecture

| Layer | Network | Primitives |
|---|---|---|
| **Lending** | Devnet | VaultCreate/Deposit/Withdraw, LoanBrokerSet, LoanSet/Pay/Manage |
| **Trading** | Devnet | EscrowCreate/Finish/Cancel, OfferCreate (ImmediateOrCancel) |
| **DCA/TWAP** | Devnet | TicketCreate + pre-signed OfferCreate |
| **Privacy** | Groth5 | Smart Escrows (XLS-0100) + RISC0 ZK proofs via Boundless |
| **Prices** | Devnet | book_offers + amm_info (native DEX/AMM, no oracle) |

## Tech Stack

- **Frontend:** Next.js 14 / React 18 / Tailwind CSS / shadcn/ui
- **Watcher Bot:** Node.js + xrpl.js v3
- **ZK Proofs:** RISC0 zkVM (Groth16) + Boundless Market
- **Wallet:** xrpl-connect (Xaman, Crossmark, GemWallet)
- **Monorepo:** pnpm workspaces + Turborepo

## Key Directories

- `apps/web/` — Next.js frontend
- `apps/watcher/` — Node.js watcher bot
- `packages/zkp/` — RISC0 guest program + CLI prover

## Naming Conventions

- **Branch:** `sofiane` (working), `main` (untouched)
- **Components:** PascalCase (`VaultDeposit.js`, `OrderCard.js`)
- **Hooks:** camelCase with `use` prefix (`usePrice.js`, `useVault.js`)
- **Utils/lib:** camelCase (`constants.js`, `networks.js`)
- **Watcher modules:** kebab-case (`devnet-loop.js`, `zk-prover.js`)
- **Variables:** camelCase (`triggerPrice`, `vaultId`, `loanBrokerId`)
- **Constants:** UPPER_SNAKE_CASE (`ORDER_STATUS`, `SIDES`)

## Design Spec

`docs/specs/2026-04-11-tellement-french-design.md`
