# Backend Implementation Design — Tellement-French

**Date:** 2026-04-11
**Scope:** Everything except frontend (Dev 2). Covers WASM Devnet setup, watcher bot, ZK proofs, integration.
**Approach:** Bottom-up — validate WASM Devnet first, then build watcher, then ZK, then integrate.

---

## Phase 1: WASM Devnet Validation

**Goal:** Prove XLS-65/66 amendments are live. Fill all empty ADDRESSES. Unblock hook testing.

### What exists

`apps/web/scripts/setup-devnet.mjs` — funds wallets, creates USD issuer + trust line, creates Vault + LoanBroker, seeds DEX with XRP/USD offers.

### What needs to change

1. **Add watcher account funding** — the script currently creates owner + issuer but no watcher. Add a third `fundWallet()` call and output `WATCHER_ACCOUNT`.

2. **Write results to file** — instead of just printing to console, write a `apps/web/scripts/devnet-addresses.json` with all addresses and seeds so they can be consumed programmatically.

3. **Update constants.js** — after running the script, fill `ADDRESSES.VAULT_ID`, `ADDRESSES.LOAN_BROKER_ID`, `ADDRESSES.RLUSD_ISSUER`, and `WATCHER_ACCOUNT`.

### Success criteria

- `VaultCreate` returns `tesSUCCESS`
- `LoanBrokerSet` returns `tesSUCCESS`
- `book_offers` returns seeded offers
- All ADDRESSES filled in constants.js
- `usePrice` hook returns a non-null price

### Risk

If XLS-65/66 amendments aren't active on WASM Devnet, VaultCreate/LoanBrokerSet will fail with `temDISABLED`. In that case: fall back to testing only the trading layer (escrow + DEX + tickets) which uses standard XRPL features.

---

## Phase 2: Watcher Bot

**Goal:** Standalone Node.js service that monitors WASM Devnet prices and executes orders.

### Structure

```
apps/watcher/
├── package.json            # deps: xrpl@^3.0.0, express@^4.18
├── src/
│   ├── index.js            # Express server + startup
│   ├── config.js           # WSS URLs, watcher seed, port
│   ├── connections.js      # ConnectionManager (WASM Devnet client)
│   ├── devnet-loop.js      # Ledger subscription + trigger evaluation
│   ├── order-cache.js      # In-memory Map for orders + DCA schedules
│   ├── dca-scheduler.js    # Interval-based submission of pre-signed blobs
│   └── zk-prover.js        # RISC0 proof gen + WASM Devnet EscrowFinish
```

### config.js

```javascript
export const config = {
  wasmDevnet: { wss: "wss://wasm.devnet.rippletest.net:51233" },
  watcherSeed: process.env.WATCHER_SEED,
  port: process.env.PORT || 3001,
}
```

### connections.js

ConnectionManager class:
- `connect()` — creates xrpl.Client for WASM Devnet using `xrpl@4.5.0-smartescrow.4` (supports Smart Escrows + lending).
- `get("wasmDevnet")` — returns the client.
- `disconnect()` — clean shutdown.
- Auto-reconnect on disconnect events.

### order-cache.js

In-memory store with two Maps:

```javascript
// orders: Map<string, OrderParams>
// key: `${owner}:${escrowSequence}`
// value: { owner, escrowSequence, triggerPrice, orderType, side, preimage,
//          condition, cancelAfter, trailingPct?, highestPrice?, computedTrigger?,
//          isPrivate?, commitment?, nonce? }

// dcaSchedules: Map<string, DcaSchedule>
// key: generated UUID
// value: { signedBlobs: string[], intervalMs, nextSubmitTime, completed, total }
```

Methods: `addOrder()`, `addDca()`, `getActiveOrders()`, `getDueSchedules()`, `removeOrder()`, `getAll()`.

### devnet-loop.js

DevnetLoop class:
- `start()` — subscribe to WASM Devnet `ledgerClosed` stream.
- `onLedger()` — each ledger close:
  1. Query `book_offers` for current XRP/USD price.
  2. For each active order: evaluate trigger condition.
  3. For trailing stops: update `highestPrice` and recompute `computedTrigger`.
  4. If triggered and public order: execute (EscrowFinish + OfferCreate + Payment).
  5. If triggered and private order: delegate to `zk-prover.js`.
  6. For DCA schedules: check if any are due, submit next blob.

Trigger logic:
```javascript
STOP_LOSS + SELL:  price <= triggerPrice
TAKE_PROFIT + SELL: price >= triggerPrice
STOP_LOSS + BUY:   price >= triggerPrice
TAKE_PROFIT + BUY:  price <= triggerPrice
TRAILING_STOP:      price <= computedTrigger (= highestPrice * (1 - trailingPct/10000))
```

Execution (public order — pair is always XRP/USD via RLUSD):

1. `EscrowFinish` with `Condition` + `Fulfillment` (crypto-condition format via `five-bells-condition`)
   - Watcher receives the escrowed funds
2. `OfferCreate` with `tfImmediateOrCancel` on WASM Devnet DEX
   - SELL side: `TakerGets` = escrowed XRP amount, `TakerPays` = `{ currency: "USD", issuer: RLUSD_ISSUER, value: ... }`
   - BUY side: `TakerGets` = `{ currency: "USD", ... }`, `TakerPays` = XRP amount
   - Trade size = full escrow amount (no partial fills)
3. `Payment` — send trade proceeds back to order owner

### Crypto-conditions (five-bells-condition)

Both frontend and watcher use the `five-bells-condition` package for PREIMAGE-SHA-256 conditions:

```javascript
import cc from "five-bells-condition"
import crypto from "crypto"

// Frontend generates preimage + condition at order creation
const preimage = crypto.randomBytes(32)
const fulfillment = new cc.PreimageSha256()
fulfillment.setPreimage(preimage)

const conditionHex = fulfillment.getConditionBinary().toString("hex").toUpperCase()
// → goes into EscrowCreate { Condition: conditionHex }

const fulfillmentHex = fulfillment.serializeBinary().toString("hex").toUpperCase()
// → frontend sends fulfillmentHex to watcher (off-chain, via POST /api/orders)
// → watcher uses it in EscrowFinish { Fulfillment: fulfillmentHex, Condition: conditionHex }
```

**Security:** The fulfillment (preimage) is the secret. Anyone who has it can finish the escrow. Frontend generates it, shares only with the watcher.

### dca-scheduler.js

DcaScheduler class:
- `isDue(schedule)` — `Date.now() >= schedule.nextSubmitTime && schedule.completed < schedule.total`
- `submitNext(schedule, client)` — take next blob, `client.submit(blob)`, increment completed, update nextSubmitTime.

Called by the ledger loop on each ledger close.

### index.js — HTTP API

Express on port 3001:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/orders` | `{ escrowSequence, owner, triggerPrice, orderType, side, preimage, condition, cancelAfter, trailingPct?, isPrivate?, commitment?, nonce? }` | Register order after frontend creates escrow |
| `POST` | `/api/dca` | `{ id, signedBlobs, intervalMs }` | Register DCA schedule after frontend signs blobs |
| `GET` | `/api/orders` | — | List all orders and statuses |
| `DELETE` | `/api/orders/:owner/:sequence` | — | Remove order from cache |
| `GET` | `/api/health` | — | Connection status for both networks |

### Dependencies

```json
{
  "dependencies": {
    "xrpl": "^3.0.0",
    "xrpl-smartescrow": "npm:xrpl@4.5.0-smartescrow.4",
    "express": "^4.18.0",
    "five-bells-condition": "^5.0.1"
  }
}
```

Install: `pnpm add xrpl express five-bells-condition --filter tellement-french-watcher`
Install alias: `pnpm add xrpl-smartescrow@npm:xrpl@4.5.0-smartescrow.4 --filter tellement-french-watcher`

Frontend also needs: `pnpm add five-bells-condition --filter web`
```

---

## Phase 3: ZK Layer (packages/zkp/)

**Goal:** RISC0 workspace that builds a guest program (proves trigger condition), an escrow WASM (verifies proof on-chain), and a CLI prover (generates proofs for the watcher).

### Structure

Based on https://github.com/boundless-xyz/xrpl-risc0-starter:

```
packages/zkp/
├── Cargo.toml              # workspace members
├── justfile                 # build-guest, build-escrow, build, prove
├── rust-toolchain.toml      # nightly + wasm32v1-none target
├── zkvm/
│   └── trigger-proof/
│       ├── Cargo.toml       # deps: risc0-build (build-dep), risc0-zkvm (guest dep)
│       ├── build.rs         # risc0_build::embed_methods()
│       ├── src/lib.rs       # Re-exports TRIGGER_PROOF_ID + TRIGGER_PROOF_ELF
│       └── guest/
│           ├── Cargo.toml   # separate workspace, dep: risc0-zkvm ^3.0.3
│           └── src/main.rs  # Guest program
├── escrow/
│   ├── Cargo.toml           # deps: trigger-proof-builder, risc0-verifier-xrpl-wasm, xrpl-wasm-stdlib
│   └── src/lib.rs           # finish() function
├── cli/
│   ├── Cargo.toml           # deps: trigger-proof-builder, risc0-zkvm, boundless-market, clap
│   └── src/main.rs          # Prover CLI
```

### Guest program (zkvm/trigger-proof/guest/src/main.rs)

Reads private inputs, validates trigger condition, commits public output:

```rust
// Private inputs (from watcher via ExecutorEnv)
let trigger_price: u64 = env::read();
let order_type: u8 = env::read();     // 0 = SL, 1 = TP
let nonce: [u8; 32] = env::read();
let current_price: u64 = env::read();

// Compute commitment
let commitment = sha256(trigger_price || order_type || nonce);

// Validate trigger condition
match order_type {
    0 => assert!(current_price <= trigger_price), // stop-loss (sell side)
    1 => assert!(current_price >= trigger_price), // take-profit (sell side)
    _ => panic!("invalid order type"),
}

// Public output: commitment + current_price (40 bytes)
env::commit_slice(&commitment);           // 32 bytes
env::commit_slice(&current_price.to_be_bytes()); // 8 bytes
```

Journal size: 40 bytes (32-byte commitment + 8-byte current_price).

### Escrow WASM (escrow/src/lib.rs)

Verifies the RISC0 proof on-chain:

```rust
#[unsafe(no_mangle)]
pub extern "C" fn finish() -> i32 {
    // Read journal (40 bytes) and seal (256 bytes) from EscrowFinish Memos
    let journal: [u8; 40] = get_memo(0).unwrap();
    let seal: [u8; 256] = get_memo(1).unwrap();

    // Extract commitment from journal
    let proof_commitment: [u8; 32] = journal[0..32].try_into().unwrap();

    // Read expected commitment from escrow Data field (set at EscrowCreate time)
    // Uses xrpl-wasm-stdlib host functions to read the escrow's own Data field
    let expected_commitment: [u8; 32] = get_escrow_data().unwrap();
    // Note: if xrpl-wasm-stdlib doesn't expose Data directly, fall back to
    // hardcoding commitment in the WASM (one WASM per order) or passing it
    // as a third Memo and trusting the ZK proof binds to it.

    // Verify commitment matches
    assert_eq!(proof_commitment, expected_commitment);

    // Verify RISC0 proof
    let proof = Proof::from_seal_bytes(&seal).unwrap();
    let journal_digest = risc0::hash_journal(&journal);
    risc0::verify(&proof, &bytemuck::cast(TRIGGER_PROOF_ID), &journal_digest).unwrap();

    1 // release funds
}
```

### CLI prover (cli/src/main.rs)

Two modes: local proving and Boundless Market.

```rust
// Local
let receipt = default_prover()
    .prove_with_opts(env, TRIGGER_PROOF_ELF, &ProverOpts::groth16())?
    .receipt;
let journal = receipt.journal.bytes.as_slice().to_vec();
let seal = encode_seal(&receipt)?;

// Boundless
let fulfillment = client.wait_for_request_fulfillment(...).await?;
let journal = fulfillment.data()?.journal()?.to_vec();
let seal = fulfillment.seal[4..].to_vec(); // trim selector
```

Output: JSON memo array for watcher to include in EscrowFinish.

### Build commands (justfile)

```
build-guest:  cargo build -p trigger-proof-builder
build-escrow: cargo build -p escrow --release --target wasm32v1-none
build:        build-guest && build-escrow
prove:        cargo run -p cli -- --trigger-price <X> --order-type <Y> --nonce <Z> --current-price <W>
```

### Key constraint

IMAGE_ID links guest to escrow. Any change to `guest/src/main.rs` requires recompiling the escrow WASM and redeploying it to WASM Devnet.

---

## Phase 4: Integration

### Setup sequence

1. Run `setup-devnet.mjs` → fund 3 wallets (owner, issuer, watcher), create vault + loan broker, seed DEX.
2. Fill `ADDRESSES` in `constants.js` with output.
3. Create `.env` for watcher with `WATCHER_SEED`.
4. Start watcher: `node apps/watcher/src/index.js`.
5. Fund watcher account on WASM Devnet via `https://wasmfaucet.devnet.rippletest.net`.
6. Build ZK workspace: `cd packages/zkp && just build`.
7. Deploy escrow WASM to WASM Devnet via web UI or script.

### E2E test flows

| # | Test | Proves |
|---|------|--------|
| 1 | Deposit XRP into Vault → check `vault_info` → check share balance | Lending layer (XLS-65) |
| 2 | Create loan → repay with `tfLoanFullPayment` | Loan lifecycle (XLS-66) |
| 3 | Create SL escrow → POST to watcher `/api/orders` → manually seed DEX to trigger → verify EscrowFinish + OfferCreate | Full trading pipeline |
| 4 | Create tickets → build+sign offers → POST to watcher `/api/dca` → watch interval submissions | DCA/TWAP pipeline |
| 5 | Create smart escrow on WASM Devnet with WASM → generate proof → EscrowFinish with Memos → verify funds released | ZK privacy pipeline |

### Deliverable order

```
Phase 1 → run setup script, fill addresses           (~30 min, unblocks everything)
Phase 2 → build watcher bot (7 files)                 (~3-4 hours)
Phase 3 → build ZK workspace (Rust, 5+ files)         (~3-4 hours)
Phase 4 → integration testing, fix issues              (~1-2 hours)
```

---

## Files changed/created

### Phase 1
- `apps/web/scripts/setup-devnet.mjs` — add watcher funding, write output to JSON
- `apps/web/lib/constants.js` — fill ADDRESSES after running script
- `apps/web/package.json` — add `five-bells-condition` dependency

### Phase 2 (all new)
- `apps/watcher/package.json`
- `apps/watcher/src/index.js`
- `apps/watcher/src/config.js`
- `apps/watcher/src/connections.js`
- `apps/watcher/src/devnet-loop.js`
- `apps/watcher/src/order-cache.js`
- `apps/watcher/src/dca-scheduler.js`
- `apps/watcher/src/zk-prover.js`

### Phase 3 (all new)
- `packages/zkp/Cargo.toml`
- `packages/zkp/justfile`
- `packages/zkp/rust-toolchain.toml`
- `packages/zkp/zkvm/trigger-proof/Cargo.toml`
- `packages/zkp/zkvm/trigger-proof/build.rs`
- `packages/zkp/zkvm/trigger-proof/src/lib.rs`
- `packages/zkp/zkvm/trigger-proof/guest/Cargo.toml`
- `packages/zkp/zkvm/trigger-proof/guest/src/main.rs`
- `packages/zkp/escrow/Cargo.toml`
- `packages/zkp/escrow/src/lib.rs`
- `packages/zkp/cli/Cargo.toml`
- `packages/zkp/cli/src/main.rs`

### Phase 4
- `apps/web/lib/constants.js` — final ADDRESSES fill
- Watcher `.env` file with seeds

### Not touched (frontend — Dev 2)
- `apps/web/components/`
- `apps/web/providers/`
- `apps/web/app/page.js`
