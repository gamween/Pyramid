# Lending Showcase Design

## Goal

Demonstrate the full XLS-65/66 lending lifecycle on WASM devnet with 3 pre-seeded vaults displayed as read-only showcase cards on the lending page. Real on-chain state, no mocks.

## Problem

- XLS-65/66 primitives work on WASM devnet but xrpl.js doesn't validate these tx types in the browser
- The setup script already bypasses this with raw signing via `ripple-keypairs`
- All transaction builders exist in hooks (`useVault`, `useLoan`) but can't be called from browser wallets
- No way for judges to see the lending feature working without pre-seeded state

## Approach: Lifecycle Showcase (3 Vaults)

### Setup Script Enhancement

Extend `apps/web/scripts/setup-devnet.mjs` to create 3 vaults at different lifecycle stages using `submitRawTx` (raw signing, bypasses xrpl.js validation).

#### Vault 1: "Fresh Vault" — Ready to Lend

**Steps:**
1. `VaultCreate` — XRP vault
2. `VaultDeposit` — 500 XRP from owner
3. `LoanBrokerSet` — attach broker with 1% management fee
4. `LoanBrokerCoverDeposit` — 50 XRP first-loss capital

**Resulting state:** Vault with 500 XRP liquidity, broker ready to originate loans, share price = 1.0, no loans.

**Primitives demonstrated:** VaultCreate, VaultDeposit, LoanBrokerSet, LoanBrokerCoverDeposit

#### Vault 2: "Active Lending" — Loans Outstanding

**Steps:**
1. `VaultCreate` — XRP vault
2. `VaultDeposit` — 1000 XRP from owner
3. `LoanBrokerSet` — attach broker
4. `LoanBrokerCoverDeposit` — 100 XRP first-loss capital
5. Fund a borrower wallet from faucet
6. `LoanSet` — 300 XRP loan to borrower (cosigned by broker + borrower via raw signing)
7. `LoanPay` — partial payment of 50 XRP from borrower

**Resulting state:** Active loan outstanding. AssetsTotal > AssetsAvailable (funds deployed). Utilization visible. Partial repayment recorded.

**Primitives demonstrated:** VaultCreate, VaultDeposit, LoanBrokerSet, LoanBrokerCoverDeposit, LoanSet, LoanPay

#### Vault 3: "Yield Earned" — Full Lifecycle Complete

**Steps:**
1. `VaultCreate` — XRP vault
2. `VaultDeposit` — 500 XRP from owner
3. `LoanBrokerSet` — attach broker
4. `LoanBrokerCoverDeposit` — 50 XRP first-loss capital
5. Fund a borrower wallet from faucet
6. `LoanSet` — 200 XRP loan to borrower
7. `LoanPay` — full repayment with `tfLoanFullPayment` flag (principal + interest)
8. `LoanDelete` — clean up completed loan

**Resulting state:** All loans repaid. Share price > 1.0 because interest was collected. Depositors earned real yield.

**Primitives demonstrated:** VaultCreate, VaultDeposit, LoanBrokerSet, LoanBrokerCoverDeposit, LoanSet, LoanPay (full), LoanDelete

### Frontend: LendingShowcase Component

**File:** `apps/web/components/LendingShowcase.js`

**Placement:** Below the existing VaultInteraction and LoanInteraction panels on the lending tab in `apps/web/app/page.js`.

**Data source:** 3 vault IDs from `apps/web/lib/constants.js` (populated by setup script). Calls `useVault().getVaultInfo(vaultId)` on mount for each vault.

**Each card displays:**
- Vault name + tagline
- Live metrics from `vault_info` RPC:
  - Total Assets / Assets Available (shows utilization for Vault 2)
  - Share Price (shows yield accrual for Vault 3)
  - Outstanding Shares
  - Loss Unrealized
- List of XLS-65/66 primitives used to build this vault's state
- Status indicator: green (ready), amber (active loans), blue (yield earned)

**Layout:** 3 cards in `lg:grid-cols-3` grid. Matches existing design: `border-white/20`, `bg-black/40`, `backdrop-blur-xl`, mono font, sharp corners (`rounded-none`).

**Behavior:** Read-only. No user interaction. Data refreshes on component mount.

### Constants Update

Add to `apps/web/lib/constants.js`:

```javascript
SHOWCASE_VAULTS: [
  {
    id: "<vault1-id>",  // populated by setup script
    name: "Fresh Vault",
    tagline: "Ready to Lend",
    status: "ready",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit"],
  },
  {
    id: "<vault2-id>",
    name: "Active Lending",
    tagline: "Loans Outstanding",
    status: "active",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay"],
  },
  {
    id: "<vault3-id>",
    name: "Yield Earned",
    tagline: "Full Lifecycle Complete",
    status: "yield",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay", "LoanDelete"],
  },
]
```

### Files Changed

| File | Change |
|---|---|
| `apps/web/scripts/setup-devnet.mjs` | Extend to create 3 vaults with different lifecycle stages |
| `apps/web/lib/constants.js` | Add `SHOWCASE_VAULTS` array with vault IDs + metadata |
| `apps/web/components/LendingShowcase.js` | New component — 3 read-only vault showcase cards |
| `apps/web/app/page.js` | Add `<LendingShowcase />` to lending tab |
