/**
 * Native Transaction Signing Service
 *
 * Standalone, type-agnostic utilities for building, signing, and submitting
 * XRPL transactions — including XLS-66 loan types that xrpl.js validate()
 * does not recognise.
 *
 * Uses `encode` and `encodeForSigning` from the `xrpl` package, which re-exports
 * them from ripple-binary-codec. Those codecs understand all XLS-65/66 fields
 * even though the higher-level transaction builders in xrpl.js do not.
 *
 * This module is intentionally wallet-agnostic and has no singleton client.
 * Callers supply a connected `Client` instance from xrplClient.js (browser) or
 * from a directly instantiated `Client` (server / watcher bot).
 *
 * Used by:
 *  - apps/watcher  cosign handler (server-side, Task 2)
 *  - useLoanMarket hook (browser-side, Task 4)
 *  - API routes (Task 3)
 */

import { encode, encodeForSigning } from "xrpl"
import { DEFAULT_NETWORK } from "./networks"

// ─── 1. autofill ─────────────────────────────────────────────────────────────

/**
 * Auto-fill common transaction fields from RPC.
 *
 * Fetches `account_info` and `ledger_current` in parallel, then returns a new
 * transaction object with:
 *  - `Fee`                 — "12" × signerCount (string, in drops)
 *  - `Sequence`            — current account sequence
 *  - `LastLedgerSequence`  — current ledger index + 20
 *  - `NetworkID`           — from DEFAULT_NETWORK (2002 on WASM devnet)
 *  - `SigningPubKey`       — optional; only set if opts.signingPubKey is provided
 *
 * @param {import("xrpl").Client} client       Connected xrpl Client instance.
 * @param {object}                tx            Partial transaction object.
 * @param {object}                [opts={}]     Optional configuration.
 * @param {number}                [opts.signerCount=1]   Number of signers (affects fee).
 * @param {string}                [opts.signingPubKey]   Hex public key to embed.
 * @returns {Promise<object>} New transaction object with auto-filled fields.
 */
export async function autofill(client, tx, opts = {}) {
  const { signerCount = 1, signingPubKey } = opts

  const [acctInfo, ledgerInfo] = await Promise.all([
    client.request({ command: "account_info", account: tx.Account }),
    client.request({ command: "ledger_current" }),
  ])

  const filled = {
    ...tx,
    Fee: String(12 * signerCount),
    Sequence: acctInfo.result.account_data.Sequence,
    LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
    NetworkID: DEFAULT_NETWORK.networkId,
  }

  if (signingPubKey !== undefined) {
    filled.SigningPubKey = signingPubKey
  }

  return filled
}

// ─── 2. getSigningData ────────────────────────────────────────────────────────

/**
 * Return the hex signing data for a transaction (the bytes the wallet must sign).
 *
 * Wraps `encodeForSigning` which prepends the standard XRPL signing prefix
 * (0x53545800) and strips fields that must not be included in the signature
 * (TxnSignature, CounterpartySignature, etc.).
 *
 * @param {object} tx  Fully-prepared transaction object.
 * @returns {string}   Hex-encoded signing data.
 */
export function getSigningData(tx) {
  return encodeForSigning(tx)
}

// ─── 3. encodeTransaction ─────────────────────────────────────────────────────

/**
 * Encode a signed transaction to a hex tx_blob ready for submission.
 *
 * @param {object} tx  Signed transaction object (must include TxnSignature).
 * @returns {string}   Hex-encoded tx_blob.
 */
export function encodeTransaction(tx) {
  return encode(tx)
}

// ─── 4. submitAndWait ─────────────────────────────────────────────────────────

/**
 * Submit a signed tx_blob and poll until it is validated (up to 10 attempts,
 * 2 s apart).
 *
 * @param {import("xrpl").Client} client   Connected xrpl Client instance.
 * @param {string}                tx_blob  Hex-encoded signed transaction blob.
 * @returns {Promise<object>}              Validated transaction result.
 * @throws {Error} If the engine_result is not `tesSUCCESS`, or if the
 *                 transaction is never validated after 10 polls.
 */
export async function submitAndWait(client, tx_blob) {
  const submitResult = await client.request({ command: "submit", tx_blob })

  if (submitResult.result.engine_result !== "tesSUCCESS") {
    throw new Error(
      `${submitResult.result.engine_result}: ${submitResult.result.engine_result_message}`
    )
  }

  const txHash = submitResult.result.tx_json?.hash

  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    try {
      const txResult = await client.request({ command: "tx", transaction: txHash })
      if (txResult.result.validated) return txResult.result
    } catch {
      // ledger may not have closed yet — continue polling
    }
  }

  // Final attempt — return whatever we have
  const txResult = await client.request({ command: "tx", transaction: txHash })
  return txResult.result
}

// ─── 5. assembleCosigned ──────────────────────────────────────────────────────

/**
 * Assemble a cosigned LoanSet transaction (XLS-66) from separate broker and
 * borrower signatures, then encode it to a tx_blob.
 *
 * The broker signature goes into the standard `TxnSignature` field.
 * The borrower's countersignature goes into `CounterpartySignature` as an
 * STObject containing their `SigningPubKey` and `TxnSignature`.
 *
 * @param {object} tx                 Prepared (unsigned) LoanSet transaction.
 * @param {string} brokerSignature    Hex signature produced by the broker.
 * @param {string} borrowerSignature  Hex signature produced by the borrower.
 * @param {string} borrowerPubKey     Hex public key of the borrower.
 * @returns {string} Hex-encoded tx_blob ready for submission.
 */
export function assembleCosigned(tx, brokerSignature, borrowerSignature, borrowerPubKey) {
  const cosigned = {
    ...tx,
    TxnSignature: brokerSignature,
    CounterpartySignature: {
      SigningPubKey: borrowerPubKey,
      TxnSignature: borrowerSignature,
    },
  }
  return encode(cosigned)
}

// ─── 6. extractCreatedId ──────────────────────────────────────────────────────

/**
 * Find the LedgerIndex of a newly-created ledger entry in a transaction result.
 *
 * Scans `txResult.meta.AffectedNodes` for a `CreatedNode` whose
 * `LedgerEntryType` matches `entryType`.
 *
 * @param {object} txResult          Validated transaction result (from `tx` RPC).
 * @param {string} entryType         The ledger entry type to look for, e.g. "Vault",
 *                                   "LoanBroker", "Loan".
 * @returns {string|null}            The LedgerIndex (hex string) or null if not found.
 */
export function extractCreatedId(txResult, entryType) {
  const node = txResult?.meta?.AffectedNodes?.find(
    (n) => n.CreatedNode?.LedgerEntryType === entryType
  )
  return node?.CreatedNode?.LedgerIndex ?? null
}
