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
| tfImmediateOrCancel | 0x00020000 | 131072 |

---

## Ledger Entry Types

### Vault
[docs](https://xrpl.org/docs/references/protocol/ledger-data/ledger-entry-types/vault)

| Field | Type |
|---|---|
| Owner | AccountID |
| Account | AccountID |
| Asset | Issue |
| AssetsTotal | Number |
| AssetsAvailable | Number |
| AssetsMaximum | Number |
| LossUnrealized | Number |
| ShareMPTID | UInt192 |
| WithdrawalPolicy | UInt8 |
| Scale | UInt8 |
| Data | Blob |

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
