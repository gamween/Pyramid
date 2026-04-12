# Browser Cosign & Loans Marketplace

**Date:** 2026-04-12
**Status:** Approved
**Scope:** Full browser-side XLS-66 signing, cosign protocol via watcher bot, loans marketplace UI

## Problem

xrpl.js@4.5.0-smartescrow.4 rejects XLS-66 transaction types (LoanSet, LoanPay, LoanManage, LoanDelete, LoanBrokerSet) in its `validate()` function. Wallet adapters (Xaman, Crossmark, GemWallet) all route through xrpl.js, so loan operations never reach the wallet for signing. The current workaround is server-side-only signing via `ripple-keypairs`, which means no browser interaction for lending.

## Solution

Three-layer architecture:

1. **XLS-66 Signing Patch** — client-side wrapper that bypasses xrpl.js validation for loan tx types, using `ripple-binary-codec` (already bundled) to produce signing data directly
2. **Cosign API + Watcher Bot** — API routes relay borrower signatures to the watcher bot, which cosigns as vault broker and submits to XRPL
3. **Loans Marketplace UI** — full-featured page for browsing vaults, borrowing, repaying, managing, and closing loans

## Architecture

```
Browser (Borrower)
  └─ Loans Page → useLoanMarket hook
       └─ XLS-66 Signing Patch (bypasses validate())
            └─ Wallet Adapter signs tx
                 └─ POST /api/loans/cosign (borrower signature)
                          │
Next.js API Routes        │
  ├─ GET  /api/loans/available  → list lendable vaults
  ├─ POST /api/loans/cosign     → relay to watcher bot
  └─ GET  /api/loans/status     → loan state by account
                          │
Watcher Bot (Broker)      │
  └─ cosign-handler.js ◄──┘
       ├─ Validates tx matches managed vault
       ├─ Validates loan terms within bounds
       ├─ Signs as broker (TxnSignature)
       ├─ Assembles CounterpartySignature (borrower)
       ├─ encode() → tx_blob
       └─ Submits to XRPL
```

## Component Design

### 1. XLS-66 Signing Patch

**File:** `apps/web/lib/xls66-signing.js`

**Purpose:** Wrap wallet signing to handle XLS-66 types that xrpl.js rejects.

**XLS-66 types:**
- `LoanBrokerSet`
- `LoanSet` (requires cosign)
- `LoanPay`
- `LoanManage`
- `LoanDelete`

**Flow:**
1. Check if `tx.TransactionType` is in the XLS-66 set
2. If standard type → pass through to `walletManager.signAndSubmit(tx)` unchanged
3. If XLS-66 type:
   a. Auto-fill tx fields (Sequence, Fee, LastLedgerSequence, NetworkID) via XRPL RPC
   b. Import `ripple-binary-codec` → `encodeForSigning(tx)` to get signing data
   c. Bypass xrpl.js validation, call the wallet adapter's signing method with the pre-encoded data
   d. Return `{ tx_json, signature, pubkey }` for cosign flow, or submit directly for single-signer txs (LoanPay, LoanManage, LoanDelete)

**Auto-fill details:**
- `Sequence`: from `account_info` RPC for the signing account
- `Fee`: "12" for single-signer, "24" for cosigned (12 per signer)
- `LastLedgerSequence`: current ledger index + 20
- `NetworkID`: 2002 (WASM devnet)
- `SigningPubKey`: from connected wallet

**Single-signer vs cosigned:**
- `LoanPay`, `LoanManage`, `LoanDelete` → single signer (borrower signs and submits directly)
- `LoanSet` → cosigned (borrower signs, sends to API, watcher bot cosigns and submits)
- `LoanBrokerSet` → single signer but broker-only (watcher bot handles this server-side during vault setup)

### 2. API Routes

**File:** `apps/web/app/api/loans/available/route.js`

```
GET /api/loans/available
```
- Connects to XRPL WASM devnet
- Queries vaults that have LoanBrokerSet configured (uses `ledger_entry` or `account_objects`)
- Returns array of:
  ```json
  {
    "vaultId": "...",
    "asset": { "currency": "...", "issuer": "..." },
    "interestRate": 5.0,
    "collateralRatio": 150,
    "availableLiquidity": "1000000",
    "brokerAccount": "r..."
  }
  ```

**File:** `apps/web/app/api/loans/cosign/route.js`

```
POST /api/loans/cosign
Body: { tx_json, borrower_signature, borrower_pubkey }
```
- Validates request body
- Forwards to watcher bot's cosign handler
- Watcher bot validates, cosigns, submits
- Returns: `{ success: true, hash: "...", status: "tesSUCCESS" }` or error

**File:** `apps/web/app/api/loans/status/route.js`

```
GET /api/loans/status?account=<address>
```
- Queries XRPL for active loans tied to the account
- Returns array of:
  ```json
  {
    "loanId": "...",
    "vaultId": "...",
    "amountBorrowed": "500000",
    "outstandingBalance": "512500",
    "interestAccrued": "12500",
    "collateralDeposited": "750000",
    "status": "active"
  }
  ```

### 3. Watcher Bot Cosign Handler

**File:** `apps/watcher/cosign-handler.js`

**Receives:** `{ tx_json, borrower_signature, borrower_pubkey }`

**Process:**
1. Parse tx_json, verify it's a `LoanSet` targeting a vault the bot manages
2. Verify loan terms are within configured bounds (amount, collateral ratio)
3. Load vault owner keypair
4. Compute `encodeForSigning(tx_json)` → signing data
5. Broker signs: `rawSign(signingData, brokerPrivateKey)` → `TxnSignature`
6. Assemble `CounterpartySignature`:
   ```json
   {
     "SigningPubKey": "<borrower_pubkey>",
     "TxnSignature": "<borrower_signature>"
   }
   ```
7. Set `tx_json.TxnSignature` = broker signature
8. Set `tx_json.CounterpartySignature` = borrower cosign object
9. `encode(tx_json)` → `tx_blob`
10. Submit via `{ command: "submit", tx_blob }`
11. Poll for validation, return result

**Communication:** The API route communicates with the watcher bot via HTTP. The watcher bot exposes an internal HTTP endpoint (e.g., `localhost:3001/cosign`) that the API route calls. This keeps the watcher bot as the sole holder of vault keys.

### 4. Loans Marketplace UI

**Page:** `apps/web/app/loans/page.js`

**Layout:** Two-panel design
- Left/top: Available Vaults (marketplace)
- Right/bottom: My Active Loans (borrower dashboard)

**Components:**

#### `LoanMarketplace.js`
- Fetches available vaults from `GET /api/loans/available`
- Renders a card grid: each vault shows asset, rate, collateral ratio, liquidity
- "Borrow" button on each card opens the borrow modal

#### `LoanBorrowModal.js`
- Input: loan amount (with max based on vault liquidity)
- Displays: required collateral, estimated interest, repayment info
- "Confirm Borrow" button:
  1. Builds `LoanSet` tx JSON
  2. Signs via XLS-66 patch (wallet prompt)
  3. Sends borrower signature to `POST /api/loans/cosign`
  4. Shows success/error result
  5. Refreshes active loans list

#### `ActiveLoans.js`
- Fetches borrower's loans from `GET /api/loans/status?account=<address>`
- Renders each loan as a card/row with status, balance, health
- Action buttons per loan: Repay, Manage, Close

#### `LoanRepayModal.js`
- Input: repay amount (partial or full)
- "Confirm Repay" button:
  1. Builds `LoanPay` tx
  2. Signs via XLS-66 patch (single-signer, no cosign needed)
  3. Submits directly to XRPL
  4. Refreshes loan status

#### `LoanManageModal.js`
- Shows current loan terms, allows modification
- Signs `LoanManage` via XLS-66 patch
- Submits directly

**Hook:** `useLoanMarket.js`
- Replaces current `useLoan.js` for browser-side operations
- Methods: `fetchAvailableVaults()`, `borrowFromVault()`, `repayLoan()`, `manageLoan()`, `closeLoan()`
- Uses XLS-66 signing patch for all tx signing
- Handles cosign flow for `LoanSet`, direct submit for others
- Polls loan status on interval

### 5. Navigation

Add "Loans" link to the app's main navigation, alongside existing Vaults/Trading/Privacy links.

## Error Handling

| Scenario | Handling |
|----------|----------|
| Wallet rejects / user cancels | Clear message, no state change, can retry |
| XLS-66 encode fails | Error with "unsupported transaction type" message |
| Cosign API unreachable | "Lending service unavailable, try again" |
| Watcher bot rejects (bounds) | Specific error: "Amount exceeds vault limit" etc. |
| Vault insufficient liquidity | Checked before cosign, shown in UI |
| XRPL tx fails (tec codes) | Map XRPL error codes to user-friendly messages |
| Repayment exceeds outstanding | Cap input to outstanding balance in UI |
| Network issues | Graceful timeout, retry prompt |

## Files Created/Modified

**New files:**
- `apps/web/lib/xls66-signing.js` — signing patch
- `apps/web/hooks/useLoanMarket.js` — marketplace hook
- `apps/web/app/loans/page.js` — loans page
- `apps/web/components/loans/LoanMarketplace.js` — vault listing
- `apps/web/components/loans/LoanBorrowModal.js` — borrow flow
- `apps/web/components/loans/ActiveLoans.js` — loan dashboard
- `apps/web/components/loans/LoanRepayModal.js` — repay flow
- `apps/web/components/loans/LoanManageModal.js` — manage flow
- `apps/web/app/api/loans/available/route.js` — available vaults endpoint
- `apps/web/app/api/loans/cosign/route.js` — cosign relay endpoint
- `apps/web/app/api/loans/status/route.js` — loan status endpoint
- `apps/watcher/cosign-handler.js` — watcher bot cosign logic

**Modified files:**
- `apps/web/components/Navigation.js` (or equivalent) — add Loans link
- `apps/watcher/index.js` (or main entry) — register cosign HTTP endpoint
- `apps/web/lib/submitRaw.js` — may extend with browser-compatible utilities

## Testing

- Verify XLS-66 patch correctly signs all 5 tx types in browser
- Verify cosign round-trip: browser sign → API → watcher cosign → XRPL submission → success
- Verify single-signer txs (LoanPay, LoanManage, LoanDelete) submit directly from browser
- Verify marketplace shows real vault data from XRPL
- Verify active loans dashboard reflects on-chain state
- Verify error cases: wallet cancel, insufficient liquidity, watcher offline
