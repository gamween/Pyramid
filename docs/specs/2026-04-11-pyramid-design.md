# Pyramid — Design Spec

**Date:** 2026-04-11
**Hackathon:** Hack the Block 2026 (PBW)
**Tracks:** Make Waves + Boundless

## Overview

Pyramid is the first DeFi protocol built on XRPL's new native lending protocol (XLS-65/66). It composes Vaults, Loans, and the native DEX into a lending + trading platform. No smart contracts, no Hooks — pure native XRPL primitives.

### What the app does

1. **EARN** — Deposit XRP/tokens into a Vault, earn yield from loan interest
2. **BORROW** — Take a loan from Vault liquidity for trading
3. **TRADE** — Advanced orders (SL, TP, trailing, OCO) via Escrow + watcher + DEX
4. **ACCUMULATE** — DCA/TWAP via Tickets + pre-signed OfferCreate
5. **PRIVATE** — ZK-hidden trigger prices via Boundless/RISC0 (Groth5)

### Networks

| Network | Purpose |
|---------|---------|
| **Devnet** (`wss://s.devnet.rippletest.net:51233`) | Everything core: lending, trading, DCA |
| **Groth5** (`wss://groth5.devnet.rippletest.net:51233`) | ZK private orders only (Boundless bounty) |

### Price Source

Native XRPL DEX/AMM: `book_offers` for bid/ask, `amm_info` for AMM spot. No oracle.

---

## Lending Layer (Flagship)

Uses native XLS-65 (Vaults) + XLS-66 (Lending Protocol) on devnet.

### Vault (XLS-65)

Pyramid creates and manages a single-asset Vault.

**Transactions used:**
- `VaultCreate` — create the Vault (one-time setup by Pyramid)
- `VaultDeposit` — user deposits assets, receives share MPTokens
- `VaultWithdraw` — user redeems shares for assets

**Exchange rate:**
- Initial: `shares = assets × scale`
- Subsequent: `shares = (assets × total_shares) / total_assets` (rounded down)
- Redemption: `assets = (shares × (total_assets - loss)) / total_shares`

### Loan Broker (XLS-66)

Pyramid acts as the Loan Broker — manages the lending protocol.

**Setup transactions:**
- `LoanBrokerSet` — create LoanBroker linked to the Vault
  - `ManagementFeeRate`: 1000 (1%)
  - `DebtMaximum`: configurable cap
- `LoanBrokerCoverDeposit` — deposit first-loss capital (risk buffer)

### Loans (XLS-66)

**Loan creation:**
- `LoanSet` — cosigned by broker (Pyramid) + borrower
  - `PrincipalRequested`: loan amount
  - `InterestRate`: annualized, 1/10th basis points (e.g., 500 = 0.5%)
  - `PaymentTotal`: number of payments
  - `PaymentInterval`: seconds between payments (e.g., 2592000 = 30 days)
  - `GracePeriod`: seconds after missed payment before default (min 60, ≤ PaymentInterval)
  - Fees: `LoanOriginationFee`, `LoanServiceFee`, `LatePaymentFee`

**Loan lifecycle:**
- `LoanPay` — borrower makes a payment (principal + interest + service fee)
  - Flags: `tfLoanFullPayment` (early repay), `tfLoanLatePayment` (late)
- `LoanManage` — broker manages delinquent loans
  - `tfLoanImpair` → starts grace period
  - `tfLoanDefault` → after grace period, defaults the loan
- `LoanDelete` — cleanup after full repayment or default

### The Flywheel

```
Depositors → VaultDeposit (earn yield)
    ↓
Vault has liquidity
    ↓
Borrowers → LoanSet (cosigned) → receive funds
    ↓
Borrowers → trade on DEX with advanced orders
    ↓
Borrowers → LoanPay (repay with profits, interest → Vault)
    ↓
Depositors earn yield → more deposits → deeper liquidity
```

---

## Trading Layer (Complementary)

All on devnet using native XRPL primitives. A Node.js watcher bot monitors prices and executes.

### Stop-Loss / Take-Profit

**Creation:**
1. User creates `EscrowCreate` on devnet:
   - `Amount`: funds to lock (e.g., 500 XRP)
   - `Destination`: watcher account
   - `Condition`: SHA-256 hash of a random preimage
   - `CancelAfter`: order expiry time
2. User shares with watcher (off-chain): trigger_price, order_type (SL/TP), side (BUY/SELL), preimage (fulfillment)

**Monitoring:**
- Watcher subscribes to devnet ledger stream
- Each ledger close: queries `book_offers` for current price
- Checks: does current_price satisfy the trigger condition?
  - SL SELL: current_price ≤ trigger_price
  - TP SELL: current_price ≥ trigger_price
  - SL BUY: current_price ≥ trigger_price
  - TP BUY: current_price ≤ trigger_price

**Execution (condition met):**
1. Watcher submits `EscrowFinish` with the preimage (fulfillment) → funds released to watcher
2. Watcher submits `OfferCreate` on DEX with `tfImmediateOrCancel` flag → market order
3. Watcher submits `Payment` → sends trade proceeds back to user

**Cancellation / Safety:**
- User can call `EscrowCancel` after `CancelAfter` time → funds returned
- If watcher goes down, funds are never lost — CancelAfter guarantees return

### Trailing Stop

Same as SL/TP but:
- Watcher tracks the price high watermark in memory
- `computed_trigger = highest_price × (1 - trailing_pct / 10000)`
- When `current_price ≤ computed_trigger` → execute (same EscrowFinish + OfferCreate flow)

### OCO (One-Cancels-Other)

- User creates TWO EscrowCreate transactions:
  - Escrow A: take-profit condition (preimage_A)
  - Escrow B: stop-loss condition (preimage_B)
  - Both have the same `CancelAfter`
- Watcher holds both preimages
- When one condition triggers → watcher finishes that escrow + executes trade
- The other escrow expires naturally via CancelAfter → user calls EscrowCancel to recover funds

### DCA (Dollar-Cost Averaging)

Uses Tickets for pre-signed orders — all on devnet, no Hooks needed.

**Setup:**
1. User submits `TicketCreate` with `TicketCount: N` (e.g., 10)
   - Reserves N sequence numbers (0.2 XRP reserve each)
2. Frontend builds N `OfferCreate` transactions, each using a different Ticket
   - Each buys `amount_per_buy` of the target asset
   - `tfImmediateOrCancel` flag
3. User signs all N transactions in the wallet
4. Frontend sends signed tx blobs to watcher

**Execution:**
- Watcher holds the N signed blobs
- Every `interval` ledgers, submits the next one to devnet
- Tickets allow out-of-sequence submission — user's wallet stays usable

**Cancellation:**
- User tells watcher to stop (off-chain)
- Unused Tickets can be cancelled via a no-op AccountSet using each Ticket

### TWAP (Time-Weighted Average Price)

Same as DCA but:
- Shorter intervals (seconds/minutes, not hours)
- Larger total amount split into smaller slices
- Purpose: execute a big order with minimal price impact

---

## ZK Privacy Layer (Boundless Bounty)

Private orders on Groth5 devnet. Trigger prices hidden via RISC0 ZK proofs.

### Lifecycle

1. **Creation:**
   - Frontend computes `commitment = sha256(trigger_price || order_type || nonce)`
   - User creates `EscrowCreate` on Groth5:
     - Amount: order funds
     - Destination: watcher account
     - Condition: requires RISC0 proof with Pyramid IMAGE_ID
     - Data: commitment hash
   - trigger_price + nonce shared with watcher (encrypted)

2. **Monitoring:**
   - Watcher monitors devnet DEX prices (same as public orders)

3. **Execution:**
   - Watcher submits proof request to **Boundless Market** (decentralized prover network)
   - RISC0 guest proves: "I know (trigger_price, nonce) such that hash matches commitment AND price condition is met"
   - Watcher submits `EscrowFinish` on Groth5 with proof (journal + seal in Memos)
   - Escrow WASM verifies proof → releases funds
   - Watcher submits `OfferCreate` on Groth5 DEX

4. **Privacy guarantee:**
   - Trigger price never revealed on-chain, not even after execution
   - Journal only contains commitment + current_price

### RISC0 Components

- **Guest program (zkVM):** verifies hash(trigger, type, nonce) == commitment AND price condition
- **Escrow contract (Groth5 WASM):** verifies RISC0 proof on EscrowFinish
- **CLI prover:** watcher calls as child process, submits to Boundless Market

---

## Watcher Bot

Node.js service with 2 modules. Each touches one network.

### Devnet Loop

Handles: SL, TP, trailing stop, OCO, DCA, TWAP.

Each ledger close on devnet:
1. Query `book_offers` + `amm_info` via xrpl.js (native, no oracle)
2. For each active escrow order: check trigger condition
3. For trailing stops: update high watermark
4. If triggered → EscrowFinish + OfferCreate + Payment back to user
5. For DCA/TWAP: check if next interval is due → submit next pre-signed tx

### ZK Prover (Groth5)

Called by devnet loop when a private order triggers:
1. Submit proof request to Boundless Market
2. Receive Groth16 proof (journal + seal)
3. EscrowFinish on Groth5 with proof in Memos
4. OfferCreate on Groth5 DEX

### Connection Manager

- Devnet: `wss://s.devnet.rippletest.net:51233` (main loop)
- Groth5: `wss://groth5.devnet.rippletest.net:51233` (ZK only)
- Auto-reconnect + health checks

### State

- Active escrow orders: cached from on-chain data, rebuilt on restart
- DCA schedules: pre-signed tx blobs held in memory
- Trailing stop watermarks: in-memory, reset on restart
- Private order secrets: trigger_price + nonce, encrypted local file

---

## Frontend

Clean dashboard. Next.js 14 + shadcn/ui on the existing scaffold.

### Views

**Dashboard (Home):**
- Stats: Vault TVL, active loans, active orders, total volume
- Vault section: deposit/withdraw, current yield, share balance
- Order list: filterable by type/status, each showing pair/condition/status

**Lending:**
- Deposit into Vault: amount input → VaultDeposit tx
- Borrow: loan request form → cosigned LoanSet
- Repay: LoanPay with amount
- Vault stats: total assets, share price, yield rate

**Create Order:**
- Order type tabs: SL / TP / Trailing / OCO / DCA / TWAP
- SL/TP: pair, side, amount, trigger_price → EscrowCreate
- Trailing: pair, side, amount, trailing_pct → EscrowCreate
- OCO: pair, side, amount, tp_price, sl_price → 2× EscrowCreate
- DCA: pair, amount_per_buy, num_buys, interval → TicketCreate + sign N txs
- TWAP: pair, total_amount, num_slices, interval → TicketCreate + sign N txs
- Private toggle: "Hide trigger price (ZK)" → routes to Groth5

**Order Detail:**
- Status, condition, network badge
- DCA/TWAP: progress bar (N/total), execution history with fill prices
- Cancel button

### Technical

- WalletProvider (existing scaffold)
- New hooks: `usePrice`, `useVault`, `useLoan`, `useOrders`
- xrpl.js for all network interactions
- shadcn/ui: Card, Button, Input, Label, Badge, Tabs

---

## Submission

### XRPL Features Used

- VaultCreate, VaultDeposit, VaultWithdraw (XLS-65)
- LoanBrokerSet, LoanBrokerCoverDeposit, LoanSet, LoanPay, LoanManage, LoanDelete (XLS-66)
- EscrowCreate, EscrowFinish, EscrowCancel (conditional fund locking)
- OfferCreate with ImmediateOrCancel (DEX execution)
- TicketCreate (parallel pre-signed DCA/TWAP)
- Payment (settlement)
- book_offers, amm_info (native price discovery)
- RISC0 ZK proofs on Groth5 (Boundless)

### Transaction Volume Estimate

Per active user:
- Each vault deposit/withdraw: 1 tx
- Each loan: 3+ txs (create + N payments + delete)
- Each SL/TP order: 4 txs (escrow create + finish + offer + payment)
- Each DCA (10 buys): 12 txs (ticket create + 10 offers + cleanup)
- Each private order: 4 txs on Groth5

10 users × 5 actions = 200+ transactions across devnet + Groth5.

### Pitch

"We built on the features that shipped THIS YEAR. Native lending, native DEX, zero-knowledge proofs. This is DeFi built WITH the chain, not on top of it."

### Roadmap

| Phase | What | When |
|---|---|---|
| Now | Devnet: lending + trading + ZK privacy | Hackathon |
| Q2 2026 | Lending hits mainnet → go live | Amendment passes |
| Q3 2026 | SC integration (XLS-101) → order engine on-chain | Post-amendment |
| Future | Margin, liquidation, dynamic rates, collateral | As amendments ship |
