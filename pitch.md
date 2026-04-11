# Tellement-French — 1-Minute Pitch

## One-liner

**Tellement-French is the first DeFi protocol built on XRPL's new native lending protocol — combining Vaults, Loans, and the native DEX into a complete trading and yield platform.**

## The Problem

XRPL just shipped a native lending protocol (XLS-65/66) — Vaults, Loans, the full stack. It entered validator voting in January 2026. But nobody has built on it yet. Meanwhile, the XRPL DEX still only supports limit orders, and there's no liquidity flywheel to attract capital.

## Why It Doesn't Exist Yet

Because the lending amendment is brand new. It's only available on devnet. We're the first team to compose it with the DEX into a real product.

## What Tellement-French Does

### Flagship: Lending & Borrowing
- **Vaults** — Deposit XRP or RLUSD, earn yield from loan interest
- **Loans** — Borrow against Vault liquidity for trading
- **Loan Broker** — Tellement-French acts as the broker, managing risk with first-loss capital
- Uses native XLS-65/66 tx types: VaultCreate, VaultDeposit, LoanSet, LoanPay

### Complementary: Advanced Trading
- **Stop-Loss / Take-Profit** — auto-trade when price hits a target
- **Trailing Stop** — follows price up, sells on X% drop
- **OCO** — take-profit + stop-loss linked
- **DCA / TWAP** — recurring buys, split large orders
- All on native XRPL DEX using Escrow + OfferCreate

### Bonus: Private Orders (Boundless)
- Trigger prices hidden via ZK proofs
- Computation offloaded to Boundless prover network, verified on-chain

## The Flywheel

```
Depositors → Vaults (earn yield from loan interest)
    ↓
Borrowers → take loans → trade on DEX with advanced orders
    ↓
Trading → generates volume + fees → attracts more depositors
    ↓
More deposits → deeper liquidity → better execution → more traders
```

## Architecture

| Layer | Network | What it does |
|---|---|---|
| **Lending** | Devnet | Native XLS-65/66 Vaults + Loans |
| **Trading** | Devnet | Native DEX + Escrow + OfferCreate |
| **Privacy** | Groth5 | RISC0 ZK proofs (Boundless) |
| **Automation** | Xahau | Hooks for DCA/TWAP |

## Tracks

- **Make Waves** — institutional DeFi, first on new lending protocol
- **Boundless** — ZK proofs for private orders

## Roadmap

| Phase | What | When |
|---|---|---|
| **Now** | Devnet: lending + trading + ZK | Hackathon |
| **Q2 2026** | Lending hits mainnet → go live | Amendment passes |
| **Q3 2026** | SC integration (XLS-101) | Post-amendment |
| **Future** | Margin, liquidation, dynamic rates | As amendments ship |

## Demo Flow

1. Deposit into Vault → VaultDeposit tx on devnet
2. Borrow against it → LoanSet tx
3. Create stop-loss → Escrow locks, watcher monitors
4. Price triggers → OfferCreate on DEX
5. Private order → ZK proof hides trigger (Boundless)
6. DCA → Xahau Hook auto-executes

**"We built on the features that shipped THIS YEAR. Native lending, native DEX, zero-knowledge proofs. This is DeFi built WITH the chain, not on top of it."**
