# XRPL API Quick Reference — Tellement-French

All fields verified against official docs as of 2026-04-11.

---

## Transactions

### Lending (XLS-65/66)

| Transaction | Docs | Required Fields |
|---|---|---|
| VaultCreate | [docs](https://xrpl.org/docs/references/protocol/transactions/types/vaultcreate) | `Asset` (Issue) |
| VaultDeposit | [docs](https://xrpl.org/docs/references/protocol/transactions/types/vaultdeposit) | `VaultID` (Hash256), `Amount` |
| VaultWithdraw | [docs](https://xrpl.org/docs/references/protocol/transactions/types/vaultwithdraw) | `VaultID` (Hash256), `Amount` |
| LoanBrokerSet | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loanbrokerset) | `VaultID` (Hash256) |
| LoanBrokerCoverDeposit | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loanbrokercoverdeposit) | `LoanBrokerID` (Hash256), `Amount` |
| LoanSet | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loanset) | `LoanBrokerID` (Hash256), `PrincipalRequested` |
| LoanPay | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loanpay) | `LoanID` (Hash256), `Amount` |
| LoanManage | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loanmanage) | `LoanID` (Hash256) |
| LoanDelete | [docs](https://xrpl.org/docs/references/protocol/transactions/types/loandelete) | `LoanID` (Hash256) |

### Trading (Standard XRPL)

| Transaction | Docs | Required Fields |
|---|---|---|
| EscrowCreate | [docs](https://xrpl.org/docs/references/protocol/transactions/types/escrowcreate) | `Amount`, `Destination` |
| EscrowFinish | [docs](https://xrpl.org/docs/references/protocol/transactions/types/escrowfinish) | `Owner`, `OfferSequence` |
| EscrowCancel | [docs](https://xrpl.org/docs/references/protocol/transactions/types/escrowcancel) | `Owner`, `OfferSequence` |
| TicketCreate | [docs](https://xrpl.org/docs/references/protocol/transactions/types/ticketcreate) | `TicketCount` (1-250) |
| OfferCreate | [docs](https://xrpl.org/docs/references/protocol/transactions/types/offercreate) | `TakerPays`, `TakerGets` |

### Smart Escrows (XLS-0100 — WASM Devnet, requires xrpl@4.5.0-smartescrow.4)

[spec](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0100-smart-escrows) | [starter](https://github.com/boundless-xyz/xrpl-risc0-starter)

**EscrowCreate — additional fields for smart escrows:**

| Field | Type | Description |
|---|---|---|
| `FinishFunction` | Blob (hex) | Compiled WASM binary with `finish() -> i32` |
| `Data` | Blob (hex) | Optional data readable by WASM at finish time |
| `CancelAfter` | UInt32 | **Mandatory** for smart escrows (safety) |

**EscrowFinish — additional fields for smart escrows:**

| Field | Type | Description |
|---|---|---|
| `ComputationAllowance` | UInt32 | Gas budget for WASM execution (use 1000000) |
| `Memos[0].MemoData` | Blob (hex) | Journal (public output of zkVM guest) |
| `Memos[1].MemoData` | Blob (hex) | Seal (256-byte Groth16 proof) |

**EscrowFinish metadata:**

| Field | Description |
|---|---|
| `GasUsed` | Actual gas consumed by WASM |
| `WasmReturnCode` | Return value of `finish()` (1 = release, 0 = keep locked) |

---

## Flags

### LoanPay
| Flag | Hex | Decimal |
|---|---|---|
| tfLoanOverpayment | 0x00010000 | 65536 |
| tfLoanFullPayment | 0x00020000 | 131072 |
| tfLoanLatePayment | 0x00040000 | 262144 |

### LoanManage
| Flag | Hex | Decimal |
|---|---|---|
| tfLoanDefault | 0x00010000 | 65536 |
| tfLoanImpair | 0x00020000 | 131072 |
| tfLoanUnimpair | 0x00040000 | 262144 |

### LoanSet
| Flag | Hex | Decimal |
|---|---|---|
| tfLoanOverpayment | 0x00010000 | 65536 |

### VaultCreate
| Flag | Hex | Decimal |
|---|---|---|
| tfVaultPrivate | 0x00010000 | 65536 |
| tfVaultShareNonTransferable | 0x00020000 | 131072 |

### OfferCreate
| Flag | Hex | Decimal |
|---|---|---|
| tfPassive | 0x00010000 | 65536 |
| tfImmediateOrCancel | 0x00020000 | 131072 |
| tfFillOrKill | 0x00040000 | 262144 |
| tfSell | 0x00080000 | 524288 |

---

## Ledger Entry Types

### Vault
[docs](https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/vault)

| Field | Type | Description |
|---|---|---|
| Account | AccountID | Vault's pseudo-account (not the owner) |
| Owner | AccountID | Vault owner's address |
| Asset | Issue | Held asset (XRP, token, or MPT) |
| AssetsTotal | Number | Total vault value |
| AssetsAvailable | Number | Liquid/available amount |
| AssetsMaximum | Number | Cap on holdings (0 = unlimited) |
| LossUnrealized | Number | Unrealized loss |
| ShareMPTID | UInt192 | MPTokenIssuance ID for vault shares |
| Scale | UInt8 | Decimal precision (sigma = 10^Scale) |
| WithdrawalPolicy | UInt8 | Withdrawal strategy |
| Data | Blob | Hex-encoded metadata (max 256 bytes) |
| Sequence | UInt32 | Sequence number at creation |

Exchange rates:
- Deposit: `shares = (assets * totalShares) / totalAssets` (initial: `assets * 10^Scale`)
- Redemption: `assets = (shares * (totalAssets - lossUnrealized)) / totalShares`

### Loan
[docs](https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/loan)

| Field | Type |
|---|---|
| LoanBrokerID | Hash256 |
| Borrower | AccountID |
| LoanSequence | UInt32 |
| PrincipalOutstanding | Number |
| TotalValueOutstanding | Number |
| ManagementFeeOutstanding | Number |
| PeriodicPayment | Number |
| InterestRate | UInt32 |
| PaymentInterval | UInt32 |
| GracePeriod | UInt32 |
| PaymentRemaining | UInt32 |
| NextPaymentDueDate | UInt32 |
| StartDate | UInt32 |

### MPToken
[docs](https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/mptoken)

| Field | Type |
|---|---|
| Account | AccountID |
| MPTokenIssuanceID | Hex |
| MPTAmount | UInt64 (as string) |
| LockedAmount | UInt64 (as string) |

### Escrow
[docs](https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/escrow)

| Field | Type |
|---|---|
| Account | AccountID |
| Destination | AccountID |
| Amount | Amount |
| Condition | Blob |
| CancelAfter | UInt32 |
| FinishAfter | UInt32 |

---

## RPC Queries

### vault_info
[docs](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/vault-methods/vault_info)

```javascript
// By vault ID
{ command: "vault_info", vault_id: "HEX_ID" }

// By owner + sequence
{ command: "vault_info", owner: "rAddress", seq: 123 }
```

Response: `result.vault` contains all Vault fields plus `shares` object:
```javascript
{
  vault: {
    Account: "rPseudoAccount",    // vault's pseudo-account
    Owner: "rOwnerAddress",       // vault owner
    AssetsTotal: 1000,            // total vault value
    AssetsAvailable: 800,         // liquid amount
    AssetsMaximum: 0,             // 0 = unlimited
    LossUnrealized: 0,            // unrealized loss
    ShareMPTID: "HEX",           // share MPT issuance ID
    Scale: 0,                     // decimal precision (sigma = 10^Scale)
    shares: {
      OutstandingAmount: "500",   // total shares issued (string)
      mpt_issuance_id: "HEX",   // same as ShareMPTID
    }
  }
}
```

Share price: `(AssetsTotal - LossUnrealized) / OutstandingAmount`

### ledger_entry
[docs](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_entry)

```javascript
// Vault (by hex ID)
{ command: "ledger_entry", vault: "HEX_ID" }

// Loan (by broker + seq)
{ command: "ledger_entry", loan: { loan_broker_id: "HEX", loan_seq: 2 } }

// LoanBroker (by owner + seq)
{ command: "ledger_entry", loan_broker: { owner: "rAddress", seq: 123 } }

// Escrow (by owner + seq)
{ command: "ledger_entry", escrow: { owner: "rAddress", seq: 126 } }

// MPToken (by issuance + account)
{ command: "ledger_entry", mptoken: { mpt_issuance_id: "HEX", account: "rAddress" } }
```

### book_offers
[docs](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/book_offers)

```javascript
{
  command: "book_offers",
  taker_gets: { currency: "XRP" },
  taker_pays: { currency: "USD", issuer: "rIssuer" },
  limit: 10
}
// Response: { result: { offers: [{ TakerPays, TakerGets, quality, owner_funds }] } }
```

### mpt_holders
[docs](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/clio-methods/mpt_holders)

```javascript
{ command: "mpt_holders", mpt_issuance_id: "HEX" }
// Response: { result: { mptokens: [{ account, mpt_amount, flags }] } }
```

---

## Signing (xrpl-connect WalletManager)

```javascript
// Sign only — returns { tx_blob, signature }
const signed = await walletManager.sign(tx)

// Sign + submit — returns { hash }
const submitted = await walletManager.signAndSubmit(tx)

// To get metadata after submit, fetch tx by hash:
const txResult = await client.request({ command: "tx", transaction: submitted.hash })
// txResult.result.meta.AffectedNodes → [{ CreatedNode: { LedgerEntryType, LedgerIndex, NewFields } }]
```

### LoanSet Cosigning
[docs](https://xrpl.org/docs/tutorials/defi/lending/use-the-lending-protocol/create-a-loan)

1. Broker (Account) signs first → adds `TxnSignature`, `SigningPubKey`
2. Borrower (Counterparty) signs second → adds `CounterpartySignature`

---

## Other Docs

- [Secure signing](https://xrpl.org/docs/concepts/transactions/secure-signing)
- [Multi-signing](https://xrpl.org/docs/concepts/accounts/multi-signing)
- [Batch transactions metadata](https://xrpl.org/docs/concepts/transactions/batch-transactions#metadata)
- [Ledger methods index](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_entry)

---

## Transaction URL Pattern

```
https://xrpl.org/docs/references/protocol/transactions/types/{txname_lowercase}
```
