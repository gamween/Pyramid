/**
 * Raw transaction submission for XLS-66 loan types.
 *
 * xrpl@4.5.0-smartescrow.4 doesn't know LoanBrokerSet, LoanSet, LoanPay,
 * LoanManage, LoanDelete. But ripple-binary-codec DOES know them.
 *
 * IMPORTANT: In the browser, wallet adapters (Xaman, Crossmark) sign via
 * xrpl.js which rejects unknown tx types. Raw signing only works server-side
 * where we have the private key (setup script, watcher bot).
 *
 * For the hackathon:
 * - Loan creation (LoanBrokerSet, LoanSet) → admin/server-side only
 * - Loan repayment (LoanPay) → needs server-side signing too
 * - Vault operations (VaultCreate, VaultDeposit, VaultWithdraw) → work in browser (xrpl.js knows them)
 * - Trading operations (EscrowCreate, OfferCreate, TicketCreate) → work in browser (standard XRPL)
 */

import { encode } from "xrpl"
import { getClient } from "./xrplClient"

// XLS-66 transaction types that need raw signing (server-side only)
export const RAW_TX_TYPES = new Set([
  "LoanBrokerSet",
  "LoanBrokerCoverDeposit",
  "LoanBrokerCoverWithdraw",
  "LoanBrokerCoverClawback",
  "LoanBrokerDelete",
  "LoanSet",
  "LoanPay",
  "LoanManage",
  "LoanDelete",
])

/**
 * Check if a transaction type needs raw signing.
 */
export function needsRawSigning(transactionType) {
  return RAW_TX_TYPES.has(transactionType)
}
