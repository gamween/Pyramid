# Tellement-French — Lending-First DeFi Protocol for XRPL

## Project Overview

Tellement-French is the first DeFi protocol built on XRPL's new native lending protocol (XLS-65/66). It combines Vaults, Loans, and the native DEX into a complete trading and yield platform. Lending is the flagship product; advanced trading tools (SL, TP, trailing, OCO, DCA, TWAP) are complementary. ZK private orders via Boundless add privacy.

Developed for the PBW 2026 Hackathon ("Hack the Block").

## Branch Strategy

- **`sofiane`** is the working branch. All feature work goes here.
- **`main`** must never be touched.

## Architecture

| Layer | Network | What it does |
|---|---|---|
| **Lending** | Devnet | Native XLS-65/66 Vaults + Loans (flagship) |
| **Trading** | Devnet | Native DEX + Escrow + OfferCreate for advanced orders |
| **Privacy** | Groth5 devnet | RISC0 ZK proofs for private orders (Boundless bounty) |
| **Automation** | Xahau testnet | Hooks for DCA/TWAP autonomous execution |

### Key Principle

Build WITH the chain, not on top of it. Use native XRPL primitives (Escrow, DEX, AMM, Vaults, Loans). No smart contract overlay for the core product.

### Price Source

Native XRPL DEX/AMM queries (`book_offers`, `amm_info`). No oracle.

## Tech Stack

- **Frontend:** Next.js 14 / React 18 / Tailwind CSS / shadcn/ui
- **Lending:** Native XLS-65/66 (VaultCreate, VaultDeposit, LoanSet, LoanPay)
- **Trading:** Native XRPL primitives (Escrow, OfferCreate)
- **ZK Proofs:** RISC0 zkVM (Groth16) on Groth5 devnet (Boundless)
- **Automation:** Xahau Hooks for DCA/TWAP
- **Watcher Bot:** Node.js + xrpl.js v3
- **XRPL Integration:** xrpl.js v3, xrpl-connect
- **Monorepo:** pnpm workspaces + Turborepo

## Conventions

- TypeScript/JavaScript throughout
- Follow existing scaffold patterns (WalletProvider, hooks, shadcn)
- Lending is the flagship product, trading is complementary
- No oracle — prices from native DEX/AMM
