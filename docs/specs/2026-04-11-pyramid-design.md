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
5. **PRIVATE** — ZK-hidden trigger prices via Smart Escrows (XLS-0100) + RISC0/Boundless on WASM Devnet

### Networks

| Network | Purpose | xrpl.js |
|---------|---------|---------|
| **WASM Devnet** (`wss://wasm.devnet.rippletest.net:51233`) | Lending, trading, DCA, price monitoring, ZK private orders via Smart Escrows (XLS-0100) | `xrpl@4.5.0-smartescrow.4` |

### Price Source

Native XRPL DEX: `book_offers` for bid/ask. `amm_info` available but not yet integrated.

---

## Lending Layer (Flagship)

Uses native XLS-65 (Vaults) + XLS-66 (Lending Protocol) on WASM Devnet.

### Vault (XLS-65)

Pyramid creates and manages a single-asset Vault.

**Transactions used:**
- `VaultCreate` — create the Vault (one-time setup by Pyramid)
- `VaultDeposit` — user deposits assets, receives share MPTokens
- `VaultWithdraw` — user redeems shares for assets

**Exchange rate:**
- Initial: `shares = assets * scale`
- Subsequent: `shares = (assets * total_shares) / total_assets` (rounded down)
- Redemption: `assets = (shares * (total_assets - loss)) / total_shares`

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
  - `GracePeriod`: seconds after missed payment before default (min 60, <= PaymentInterval)
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

All on WASM Devnet using native XRPL primitives. A Node.js watcher bot monitors prices and executes.

### Stop-Loss / Take-Profit

**Creation:**
1. User creates `EscrowCreate` on WASM Devnet:
   - `Amount`: funds to lock (e.g., 500 XRP)
   - `Destination`: watcher account
   - `Condition`: SHA-256 hash of a random preimage
   - `CancelAfter`: order expiry time
2. User shares with watcher (off-chain): trigger_price, order_type (SL/TP), side (BUY/SELL), preimage (fulfillment)

**Monitoring:**
- Watcher subscribes to WASM Devnet ledger stream
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

Uses Tickets for pre-signed orders — all on WASM Devnet, no Hooks needed.

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
- Every `interval` ledgers, submits the next one to WASM Devnet
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

Private orders on WASM Devnet. Trigger prices hidden via RISC0 ZK proofs, verified **on-chain** by Smart Escrows (XLS-0100).

### How Privacy Works

Public orders expose trigger prices on-chain (the watcher knows and could leak them). Private orders solve this: the trigger price is hidden in a cryptographic commitment, and a ZK proof proves the execution condition was legitimately met — without ever revealing the trigger price.

The escrow uses a **`FinishFunction`** — a compiled WASM binary deployed at escrow creation time. When someone submits `EscrowFinish`, WASM Devnet's rippled executes the WASM on-chain. The WASM reads the proof from Memos, verifies it using the built-in BN254/Groth16 precompiles, and returns 1 to release funds.

This is **not Hooks** — it's XLS-0100 Smart Escrows, a separate XRPL feature available on the WASM Devnet.

### Lifecycle

1. **Setup (one-time):**
   - Build RISC0 guest program (proves trigger price condition)
   - Build escrow WASM (verifies RISC0 proof on-chain, linked by `IMAGE_ID`)
   - Both compiled via `xrpl-risc0-starter` workspace structure

2. **Creation:**
   - Frontend computes `commitment = sha256(trigger_price || order_type || nonce)`
   - User creates `EscrowCreate` on **WASM Devnet**:
     - `Amount`: order funds (in drops)
     - `Destination`: watcher account
     - `FinishFunction`: hex-encoded escrow WASM binary
     - `Data`: commitment hash (readable by WASM at finish time)
     - `CancelAfter`: order expiry time (mandatory for smart escrows)
   - trigger_price + nonce shared with watcher (encrypted, off-chain)

3. **Monitoring:**
   - Watcher monitors **WASM Devnet** DEX prices (`book_offers` + `amm_info`)
   - Same price feed as public orders

4. **Execution (condition met):**
   - Watcher generates RISC0 Groth16 proof (local or via **Boundless Market**)
   - Guest proves: "I know (trigger_price, nonce) such that hash matches commitment AND price condition is met"
   - Proof output: journal (public — commitment + current_price) + seal (256-byte Groth16 proof)
   - Watcher submits `EscrowFinish` on **WASM Devnet**:
     - `Owner`: escrow creator
     - `OfferSequence`: from EscrowCreate
     - `ComputationAllowance`: 1000000 (gas budget for WASM execution)
     - `Memos[0]`: journal (hex-encoded)
     - `Memos[1]`: seal (hex-encoded, always 256 bytes)
   - WASM Devnet rippled executes WASM `finish()` → reads Memos → verifies proof → returns 1 → funds released
   - Watcher submits `OfferCreate` on WASM Devnet DEX with `tfImmediateOrCancel`
   - Watcher submits `Payment` → sends proceeds back to user

5. **Privacy guarantee:**
   - Trigger price never revealed on-chain, not even after execution
   - Commitment hash is in escrow `Data` field
   - ZK proof verified on-chain by WASM — trustless, no need to trust the watcher
   - Journal only contains commitment + current_price (not the trigger itself)

6. **Cancellation / Safety:**
   - User calls `EscrowCancel` after `CancelAfter` time → funds returned
   - `CancelAfter` is mandatory for smart escrows — funds are never permanently locked

### RISC0 Components (packages/zkp/)

Based on `xrpl-risc0-starter` (https://github.com/boundless-xyz/xrpl-risc0-starter):

```
packages/zkp/
├── zkvm/trigger-proof/          # Build crate: compiles guest, exports IMAGE_ID + ELF
│   ├── guest/src/main.rs        # RISC0 guest: proves trigger condition
│   ├── build.rs                 # risc0_build::embed_methods()
│   └── src/lib.rs               # Re-exports TRIGGER_PROOF_ID + TRIGGER_PROOF_ELF
├── escrow/src/lib.rs            # WASM contract: verifies proof on-chain (wasm32v1-none)
├── cli/src/main.rs              # Prover CLI: local or Boundless Market
└── justfile                     # build, prove, test commands
```

- **Guest program:** reads (trigger_price, order_type, nonce, current_price) → validates condition → commits (commitment, current_price) to journal
- **Escrow WASM:** reads journal + seal from Memos, reads commitment from `Data`, verifies RISC0 proof against `TRIGGER_PROOF_ID`
- **CLI prover:** builds `ExecutorEnv`, proves with `ProverOpts::groth16()`, outputs journal + seal as hex memo JSON
- **IMAGE_ID linkage:** both CLI and escrow import from the same build crate — any guest change regenerates IMAGE_ID, requiring escrow WASM redeployment

### Key Dependencies

| Crate | Version | Notes |
|---|---|---|
| `risc0-zkvm` | ^3.0.3 | Core zkVM prover + verifier |
| `risc0-verifier-xrpl-wasm` | 0.1.0 | On-chain proof verifier for XRPL WASM |
| `xrpl-wasm-stdlib` | 0.8.0 | XRPL WASM host function bindings |
| `boundless-market` | 1.3.3 | Boundless proving market client |
| `xrpl.js` | 4.5.0-smartescrow.4 | Required for FinishFunction + ComputationAllowance fields |

---

## Watcher Bot

Node.js service connected to WASM Devnet. Monitors prices and executes orders.

### Devnet Loop

Handles: SL, TP, trailing stop, OCO, DCA, TWAP.

Each ledger close on WASM Devnet:
1. Query `book_offers` via xrpl.js (native, no oracle; `amm_info` not yet integrated)
2. For each active escrow order: check trigger condition
3. For trailing stops: update high watermark
4. If triggered → EscrowFinish + OfferCreate + Payment back to user
5. For DCA/TWAP: check if next interval is due → submit next pre-signed tx

### ZK Prover (WASM Devnet)

Called by the ledger loop when a private order triggers:
1. Generate RISC0 Groth16 proof (local or Boundless Market)
2. Receive proof: journal + seal (256 bytes)
3. `EscrowFinish` on **WASM Devnet** with `ComputationAllowance: 1000000` + proof in Memos
4. WASM Devnet verifies proof on-chain → releases funds
5. `OfferCreate` on WASM Devnet DEX + `Payment` back to user

### Connection Manager

- WASM Devnet: `wss://wasm.devnet.rippletest.net:51233` (lending, trading, DCA, price monitoring, ZK smart escrows) — `xrpl@4.5.0-smartescrow.4`
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
- Stats: Vault TVL, XRP/USD Price, Vault Shares, Share Price, ZK-Proofs (placeholder)
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
- Private toggle: "Hide trigger price (ZK)" → EscrowCreate on WASM Devnet with FinishFunction (WASM) + commitment in Data

**Order Detail:**
- Status, condition, network badge
- DCA/TWAP: progress bar (N/total), execution history with fill prices
- Cancel button

### Technical

- WalletProvider (existing scaffold)
- Hooks: `usePrice`, `useVault`, `useLoan`, `useEscrow`, `useTickets`, `useWalletManager`
- xrpl.js for all network interactions
- shadcn/ui: Card, Button, Input, Label, Badge, Tabs

---

## Frontend Integration Guide

This section maps every UI button/action to the exact hook function call. All hooks are in `apps/web/hooks/`. All require a connected wallet via `WalletProvider`.

### Wallet Connection

**Hook:** `useWalletManager()` (`hooks/useWalletManager.js`)

Initializes wallet adapters on mount. Uses `xrpl-connect` with adapters: Xaman, WalletConnect, Crossmark, GemWallet, Otsu.

| Button | Action |
|--------|--------|
| "Connect Wallet" | `walletManager.connect("crossmark")` — pass adapter name as string |
| "Disconnect" | `walletManager.disconnect()` |

**Wallet state** comes from `WalletProvider` context:
- `isConnected` (boolean)
- `accountInfo` → `{ address, network, walletName }`
- `walletManager.account.address` → user's r-address

**Network:** Hardcoded to `"devnet"` in WalletManager config.

### Live Price Feed

**Hook:** `usePrice()` (`hooks/usePrice.js`)

Auto-subscribes to ledger stream on mount. Updates every ledger close (~4s).

```js
const { price, bid, ask, loading, error } = usePrice()
```

| Field | Type | Description |
|-------|------|-------------|
| `price` | `number \| null` | Mid price (avg of bid + ask), USD per XRP |
| `bid` | `number \| null` | Best bid (sell XRP for USD) |
| `ask` | `number \| null` | Best ask (buy XRP with USD) |
| `loading` | `boolean` | True until first fetch completes |
| `error` | `string \| null` | Error message if fetch failed |

No buttons needed — auto-updates. Display in header/dashboard.

### Vault (Lending)

**Hook:** `useVault()` (`hooks/useVault.js`)

```js
const { createVault, deposit, withdraw, getVaultInfo, getShareBalance } = useVault()
```

| Button | Hook Call | Parameters | Returns |
|--------|-----------|------------|---------|
| "Deposit" | `deposit(vaultId, amount)` | `vaultId`: string (hash), `amount`: string (drops, e.g. `"500000000"` = 500 XRP) | `{ hash }` |
| "Withdraw" | `withdraw(vaultId, amount)` | Same as deposit | `{ hash }` |
| "Refresh Vault Stats" | `getVaultInfo(vaultId)` | `vaultId`: string | See return shape below |
| "My Shares" | `getShareBalance(vaultId, account)` | `vaultId`: string, `account`: user's r-address | `string` (share amount) |

**`getVaultInfo` return shape:**
```js
{
  totalAssets: number,       // Total XRP in vault (drops as number)
  assetsAvailable: number,   // Available for new loans
  assetsMaximum: number,     // Cap (0 = unlimited)
  lossUnrealized: number,    // Pending losses
  totalShares: number,       // Outstanding share MPTokens
  sharePrice: number,        // Current price per share
  owner: string,             // Vault owner r-address
  account: string,           // Vault account r-address
  mptIssuanceId: string,     // MPToken issuance ID for shares
  scale: number,             // Decimal scale factor
}
```

**Note:** `ADDRESSES.VAULT_ID` in `lib/constants.js` must be set to the protocol's vault hash after setup.

### Loans (Lending)

**Hook:** `useLoan()` (`hooks/useLoan.js`)

```js
const { createLoanBroker, depositCover, createLoan, payLoan, manageLoan, deleteLoan, getLoanInfo } = useLoan()
```

| Button | Hook Call | Parameters | Returns |
|--------|-----------|------------|---------|
| "Request Loan" | `createLoan(loanBrokerId, borrowerAddress, principal, interestRate?, paymentTotal?, paymentInterval?, gracePeriod?)` | `loanBrokerId`: string, `borrowerAddress`: r-address, `principal`: string (drops), optionals have defaults from `LENDING` constants | `{ tx_blob, tx }` — needs borrower cosign (see flow below) |
| "Repay" | `payLoan(loanId, amount, flags?)` | `loanId`: string (hash), `amount`: string (drops), `flags`: number (0 = normal, see `LOAN_PAY_FLAGS`) | `{ hash }` |
| "Full Repay" | `payLoan(loanId, amount, 0x00020000)` | Use `LOAN_PAY_FLAGS.tfLoanFullPayment` | `{ hash }` |
| "Loan Info" | `getLoanInfo(loanBrokerId, loanSeq)` | `loanBrokerId`: string, `loanSeq`: number | Loan ledger entry object |

**Cosign flow for new loans:**
1. Broker (our backend/admin) calls `createLoan(...)` → gets `{ tx_blob, tx }`
2. `tx_blob` is sent to borrower (the frontend user)
3. Borrower signs the same transaction via their wallet
4. Both signatures combined and submitted
5. **For hackathon MVP:** The broker signs server-side, and the frontend just needs to display loan status and repay.

**Admin-only functions** (not for regular UI, broker/watcher manages these):

| Action | Hook Call | Parameters |
|--------|-----------|------------|
| Setup broker | `createLoanBroker(vaultId, managementFeeRate?)` | `vaultId`: string |
| Deposit cover | `depositCover(loanBrokerId, amount)` | First-loss capital |
| Impair loan | `manageLoan(loanId, "impair")` | Starts grace period |
| Default loan | `manageLoan(loanId, "default")` | After grace period |
| Delete loan | `deleteLoan(loanId)` | After full repay or default |

**LENDING defaults** (`lib/constants.js`):
- `MANAGEMENT_FEE_RATE`: 1000 (1%)
- `DEFAULT_INTEREST_RATE`: 500 (0.5% annualized)
- `DEFAULT_PAYMENT_INTERVAL`: 2592000 (30 days in seconds)
- `DEFAULT_GRACE_PERIOD`: 604800 (7 days in seconds)

### Trading Orders (Escrow-based)

**Hook:** `useEscrow()` (`hooks/useEscrow.js`)

```js
const { createEscrow, finishEscrow, cancelEscrow, getEscrow } = useEscrow()
```

| Button | Hook Call | Parameters | Returns |
|--------|-----------|------------|---------|
| "Create SL/TP Order" | `createEscrow(destination, amount, condition, cancelAfter)` | `destination`: watcher r-address (or null → uses `WATCHER_ACCOUNT`), `amount`: string (drops), `condition`: hex SHA-256 hash, `cancelAfter`: number (ripple epoch timestamp) | `{ hash, escrowId, sequence }` |
| "Cancel Order" | `cancelEscrow(owner, sequence)` | `owner`: creator r-address, `sequence`: number (from createEscrow) | `{ hash }` |
| "Check Order" | `getEscrow(owner, sequence)` | Same | Escrow ledger entry object |

**Order creation flow for SL/TP:**
1. Frontend generates a random preimage (32 bytes) → `crypto.randomBytes(32)`
2. Compute SHA-256 condition: `sha256(preimage)` → hex-encode with PREIMAGE-SHA-256 prefix
3. Pick `cancelAfter` (e.g., 24h from now in ripple epoch: `Math.floor(Date.now()/1000) - 946684800 + 86400`)
4. Call `createEscrow(null, amountInDrops, conditionHex, cancelAfter)`
5. Send to watcher (off-chain POST): `{ escrowId, sequence, owner, trigger_price, order_type, side, preimage, cancelAfter }`
6. Watcher monitors and executes via `EscrowFinish` + `OfferCreate` + `Payment`

**Trailing Stop** — Same `createEscrow`, but send `trailing_pct` (basis points) instead of `trigger_price` to watcher.

**OCO** — Two `createEscrow` calls:
1. Escrow A: TP condition (preimage_A)
2. Escrow B: SL condition (preimage_B)
3. Same `cancelAfter` for both
4. Send both to watcher. When one triggers, the other expires naturally.

**Watcher API** (REST endpoint on watcher bot):
```
POST   /api/orders                  — Register order after frontend creates escrow
POST   /api/dca                     — Register DCA schedule after frontend signs blobs
GET    /api/orders                  — List all orders and DCA schedules
DELETE /api/orders/:owner/:sequence — Remove order from cache
GET    /api/health                  — Health check
```
Note: per-user filtering (`GET /api/orders/:owner`) is not yet implemented.

### DCA / TWAP

**Hook:** `useTickets()` (`hooks/useTickets.js`)

```js
const { createTickets, buildPresignedOffers, signAll } = useTickets()
```

**DCA Creation Flow (3 steps):**

| Step | Button | Hook Call | Parameters |
|------|--------|-----------|------------|
| 1 | "Create DCA Plan" | `createTickets(count)` | `count`: number (e.g., 10 for 10 buys) |
| 2 | (auto) | `buildPresignedOffers(ticketSequences, pair, amountPerBuy, side)` | `ticketSequences`: number[] (from step 1), `pair`: `{ usdAmount }`, `amountPerBuy`: string (drops), `side`: `"BUY"` or `"SELL"` |
| 3 | "Sign All" | `signAll(txs)` | `txs`: transaction objects from step 2 |

After step 3, the signed blobs are sent to the watcher which submits them at intervals.

```
POST /api/dca
Body: { signedBlobs: string[], interval: number (seconds), owner: string }
```

**TWAP** — Same flow, just shorter intervals and larger amounts split into more slices.

**`buildPresignedOffers` details:**
- Each tx uses `OfferCreate` with `tfImmediateOrCancel` (flag `0x00020000`)
- `Sequence: 0` (required when using TicketSequence)
- BUY: `TakerPays` = XRP drops, `TakerGets` = `{ currency: "USD", issuer: RLUSD_ISSUER, value }`
- SELL: reversed

### Constants & Addresses (`lib/constants.js`)

These must be filled before the frontend works:

| Constant | Where to get it | Used by |
|----------|----------------|---------|
| `ADDRESSES.VAULT_ID` | Output of `createVault()` — run setup script once | Vault deposit/withdraw/info |
| `ADDRESSES.LOAN_BROKER_ID` | Output of `createLoanBroker()` | Loan operations |
| `ADDRESSES.RLUSD_ISSUER` | WASM Devnet RLUSD gateway address (from faucet or trust line setup) | Price feed, offers |
| `WATCHER_ACCOUNT` | Watcher bot's funded WASM Devnet r-address | Escrow destination |

### Order Types & Status Enums

```js
import { ORDER_TYPES, ORDER_STATUS, SIDES } from "@/lib/constants"

ORDER_TYPES: { STOP_LOSS, TAKE_PROFIT, TRAILING_STOP, OCO, DCA, TWAP }
ORDER_STATUS: { ACTIVE, TRIGGERED, EXECUTED, CANCELLED, EXPIRED }
SIDES: { BUY, SELL }
```

### Error Handling

All hook functions throw on error. Wrap in try/catch:
```js
try {
  const result = await deposit(vaultId, amount)
  showStatus(`Deposited! tx: ${result.hash}`, "success")
} catch (err) {
  showStatus(err.message, "error")
}
```

Common errors:
- `"Wallet not connected"` — user hasn't connected yet
- `tecUNFUNDED` — insufficient XRP balance
- `tecNO_ENTRY` — vault/loan/escrow doesn't exist
- `tecNO_PERMISSION` — wrong account for this operation

---

## Submission

### XRPL Features Used

- VaultCreate, VaultDeposit, VaultWithdraw (XLS-65)
- LoanBrokerSet, LoanBrokerCoverDeposit, LoanSet, LoanPay, LoanManage, LoanDelete (XLS-66)
- EscrowCreate, EscrowFinish, EscrowCancel (conditional fund locking)
- OfferCreate with ImmediateOrCancel (DEX execution)
- TicketCreate (parallel pre-signed DCA/TWAP)
- Payment (settlement)
- book_offers (native price discovery; amm_info planned)
- Smart Escrows with FinishFunction (XLS-0100) on WASM Devnet
- RISC0 ZK proofs via Boundless Market, verified on-chain by escrow WASM

### Transaction Volume Estimate

Per active user:
- Each vault deposit/withdraw: 1 tx
- Each loan: 3+ txs (create + N payments + delete)
- Each SL/TP order: 4 txs (escrow create + finish + offer + payment)
- Each DCA (10 buys): 12 txs (ticket create + 10 offers + cleanup)
- Each private order: 4 txs on WASM Devnet (escrow create + finish w/ proof + offer + payment)

10 users × 5 actions = 200+ transactions on WASM Devnet.

### Pitch

"We built on the features that shipped THIS YEAR. Native lending, native DEX, zero-knowledge proofs. This is DeFi built WITH the chain, not on top of it."

### Roadmap

| Phase | What | When |
|---|---|---|
| Now | WASM Devnet: lending + trading + ZK privacy | Hackathon |
| Q2 2026 | Lending hits mainnet → go live | Amendment passes |
| Q3 2026 | SC integration (XLS-101) → order engine on-chain | Post-amendment |
| Future | Margin, liquidation, dynamic rates, collateral | As amendments ship |
