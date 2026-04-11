# Tellement-French — 1-Minute Pitch

## One-liner

**First DeFi protocol built on XRPL's new native lending — Vaults, Loans, advanced trading, ZK privacy. No smart contracts. Pure chain-native.**

## The Problem

XRPL shipped a native lending protocol (XLS-65/66) in January 2026. Nobody has built on it yet. The DEX only supports limit orders. There's no liquidity flywheel.

## What We Built

### Lending (flagship)
- **Vaults** — deposit, earn yield from loan interest
- **Loans** — borrow from Vault liquidity, fixed term + rate
- Native XLS-65/66: VaultCreate, VaultDeposit, LoanSet, LoanPay

### Trading (complementary)
- **Stop-Loss / Take-Profit / Trailing / OCO** — Escrow locks funds, watcher monitors DEX prices, executes OfferCreate when triggered
- **DCA / TWAP** — pre-sign N orders with Tickets, watcher submits at intervals

### Privacy (Boundless bounty)
- Trigger prices hidden via ZK proofs, verified on Groth5

## The Flywheel

```
Depositors → Vaults (earn yield)
    ↓
Borrowers → loans → trade with advanced orders
    ↓
Trading → volume → more depositors → deeper liquidity
```

## Why It's Native

No SC. No Hooks. 8+ native XRPL transaction types:

VaultCreate, VaultDeposit, LoanBrokerSet, LoanSet, LoanPay,
EscrowCreate, EscrowFinish, OfferCreate, TicketCreate, Payment

We didn't add a layer — we composed the chain's own primitives.

## Architecture

| What | Network | How |
|---|---|---|
| Lending + Trading + DCA | Devnet | Native XLS-65/66 + Escrow + DEX + Tickets |
| ZK Privacy | Groth5 | RISC0 proofs via Boundless |

## Roadmap

| Now | Hackathon — devnet demo |
|---|---|
| Q2 2026 | Lending hits mainnet → go live |
| Q3 2026 | SC integration (XLS-101) → order engine on-chain |
| Future | Margin, liquidation, collateral, dynamic rates |

## Demo

1. Deposit into Vault → VaultDeposit tx
2. Borrow → cosigned LoanSet tx
3. Stop-loss → EscrowCreate locks funds, watcher monitors
4. Price triggers → EscrowFinish + OfferCreate on DEX
5. DCA → TicketCreate + pre-signed orders, auto-executed
6. Private order → ZK proof hides trigger (Boundless)

**"We built on the features that shipped THIS YEAR. This is DeFi built WITH the chain, not on top of it."**
