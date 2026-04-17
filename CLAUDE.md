# Pyramid — Lending-First DeFi Protocol for XRPL

## Project Overview

First DeFi protocol built on XRPL's native lending protocol (XLS-65/66). Composes Vaults, Loans, and the native DEX into a complete trading + yield platform. No smart contracts, no Hooks — pure native XRPL primitives.

## Branch Strategy

- **`main`** must never be touched directly.
- Stabilization and audit work may begin from approved `chore/*` branches when the repo is already mid-cleanup.
- Implementation work should happen in an isolated project-local worktree at `.worktrees/<branch-name>`.
- **Workflow:** create `fix/<name>` or `refactor/<name>` from the approved audit/spec branch → work in the matching `.worktrees/<branch-name>` directory → verify → merge back intentionally.
- Commit messages: `chore:`, `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Architecture

| Layer | Network | Primitives |
|---|---|---|
| **Lending** | WASM Devnet | VaultCreate/Deposit/Withdraw, LoanBrokerSet, LoanSet/Pay/Manage |
| **Trading** | WASM Devnet | EscrowCreate/Finish/Cancel, OfferCreate (ImmediateOrCancel) |
| **DCA/TWAP** | WASM Devnet | TicketCreate + pre-signed OfferCreate |
| **Privacy** | WASM Devnet | Smart Escrows (XLS-0100) + RISC0 ZK proofs via Boundless |
| **Prices** | WASM Devnet | book_offers + amm_info (native DEX/AMM, no oracle) |

## Tech Stack

- **Frontend:** Next.js 14 / React 18 / Tailwind CSS / shadcn/ui
- **Watcher Bot:** Node.js + xrpl.js v4 (smartescrow fork)
- **ZK Proofs:** RISC0 zkVM (Groth16) + Boundless Market
- **Wallet:** xrpl-connect (Xaman, Crossmark, GemWallet)
- **Monorepo:** pnpm workspaces + Turborepo

## Key Directories

- `apps/web/` — Next.js frontend
- `apps/watcher/` — Node.js watcher bot
- `packages/zkp/` — RISC0 guest program + CLI prover

## Naming Conventions

- **Branch:** `chore/*` for audit/cleanup, `fix/*` or `refactor/*` for implementation, `main` untouched
- **Components:** PascalCase (`VaultDeposit.js`, `OrderCard.js`)
- **Hooks:** camelCase with `use` prefix (`usePrice.js`, `useVault.js`)
- **Utils/lib:** camelCase (`constants.js`, `networks.js`)
- **Watcher modules:** kebab-case (`devnet-loop.js`, `zk-prover.js`)
- **Variables:** camelCase (`triggerPrice`, `vaultId`, `loanBrokerId`)
- **Constants:** UPPER_SNAKE_CASE (`ORDER_STATUS`, `SIDES`)

## Design Spec

`docs/specs/2026-04-11-pyramid-design.md`
