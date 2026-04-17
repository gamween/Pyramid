import { encode, encodeForSigning, Wallet } from "xrpl"
import { config } from "./config.js"

// Raw signing — bypasses xrpl.js validation for tx types it doesn't know (XLS-66 loans)
let rawSign
try {
  const mod = await import("ripple-keypairs")
  rawSign = mod.sign || mod.default?.sign
} catch {
  const { fileURLToPath } = await import("url")
  const { dirname, join } = await import("path")
  const keypairsPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../node_modules/.pnpm/xrpl@4.5.0-smartescrow.4/node_modules/ripple-keypairs/dist/index.js"
  )
  const mod = await import(keypairsPath)
  rawSign = mod.sign || mod.default?.sign
}

/** Get the current open-ledger fee from the server (in drops). */
async function getCurrentFee(client, signerCount = 1) {
  try {
    const info = await client.request({ command: "server_info" })
    const baseFee = parseInt(info.result.info.validated_ledger?.base_fee_xrp * 1_000_000 || "10", 10)
    const loadFactor = info.result.info.load_factor || 1
    const fee = Math.max(baseFee * loadFactor * signerCount, 12 * signerCount)
    return String(Math.ceil(fee))
  } catch {
    // Fallback: safe default
    return String(120 * signerCount)
  }
}

export class CosignHandler {
  constructor(connections) {
    this.connections = connections
    // Vault owner wallet for cosigning — separate from the watcher's trading wallet
    this.vaultOwnerWallet = config.vaultOwnerSeed
      ? Wallet.fromSeed(config.vaultOwnerSeed)
      : null
    // Borrower wallet for server-side cosigning (browser wallets can't sign XLS-66 types)
    this.borrowerWallet = config.borrowerSeed
      ? Wallet.fromSeed(config.borrowerSeed)
      : null
  }

  /** Get the vault owner wallet (broker). Falls back to watcher wallet if no separate owner configured. */
  getOwnerWallet() {
    return this.vaultOwnerWallet || this.connections.getWallet()
  }

  /**
   * Full server-side borrow: prepare, sign both sides, submit.
   * Browser wallets can't sign XLS-66 types, so the watcher handles
   * both broker (TxnSignature) and borrower (CounterpartySignature).
   */
  async borrowFromVault({ vaultId, principalDrops, interestRate, paymentTotal, paymentInterval, gracePeriod }) {
    const client = this.connections.getClient()
    const broker = this.getOwnerWallet()
    const borrower = this.borrowerWallet
    if (!broker) throw new Error("Vault owner wallet not configured (set VAULT_OWNER_SEED)")
    if (!borrower) throw new Error("Borrower wallet not configured (set BORROWER_SEED)")

    // Validate vault
    const vaultConfig = config.managedVaults[vaultId]
    if (!vaultConfig) throw new Error(`Vault ${vaultId} not managed by this watcher`)
    if (!vaultConfig.loanBrokerId) throw new Error(`Vault ${vaultId} has no loan broker`)

    // Check liquidity
    const vaultEntry = await client.request({ command: "ledger_entry", index: vaultId })
    const available = parseInt(vaultEntry.result.node?.AssetsAvailable || "0", 10)
    if (available < principalDrops) {
      throw new Error(`Insufficient liquidity: ${(available / 1_000_000).toFixed(2)} XRP available`)
    }

    // Auto-fill LoanSet
    const acctInfo = await client.request({ command: "account_info", account: broker.address })
    const ledgerInfo = await client.request({ command: "ledger_current" })
    const fee = await getCurrentFee(client, 2)
    const prepared = {
      TransactionType: "LoanSet",
      Account: broker.address,
      LoanBrokerID: vaultConfig.loanBrokerId,
      Counterparty: borrower.address,
      PrincipalRequested: String(principalDrops),
      InterestRate: interestRate || 500,
      PaymentTotal: paymentTotal || 12,
      PaymentInterval: paymentInterval || 2592000,
      GracePeriod: gracePeriod || 604800,
      Fee: fee,
      Sequence: acctInfo.result.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
      NetworkID: 2002,
      SigningPubKey: broker.publicKey,
    }

    // Both parties sign the same data
    const signingData = encodeForSigning(prepared)
    prepared.TxnSignature = rawSign(signingData, broker.privateKey)
    prepared.CounterpartySignature = {
      SigningPubKey: borrower.publicKey,
      TxnSignature: rawSign(signingData, borrower.privateKey),
    }

    // Submit
    const tx_blob = encode(prepared)
    const result = await client.request({ command: "submit", tx_blob })
    if (result.result.engine_result !== "tesSUCCESS") {
      throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
    }

    const txHash = result.result.tx_json?.hash
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const txResult = await client.request({ command: "tx", transaction: txHash })
        if (txResult.result.validated) {
          const loanId = txResult.result.meta?.AffectedNodes?.find(
            (n) => n.CreatedNode?.LedgerEntryType === "Loan"
          )?.CreatedNode?.LedgerIndex
          return { hash: txHash, loanId, borrowerAddress: borrower.address, result: "tesSUCCESS" }
        }
      } catch {}
    }
    return { hash: txHash, loanId: null, borrowerAddress: borrower.address, result: "pending" }
  }

  /**
   * Repay a loan server-side (LoanPay).
   * Browser wallets can't sign XLS-66, so the watcher signs with the borrower key.
   */
  async repayLoan({ loanId, amountDrops, flags = 0 }) {
    if (!this.borrowerWallet) throw new Error("Borrower wallet not configured (set BORROWER_SEED)")
    return this._signAndSubmitRaw(this.borrowerWallet, {
      TransactionType: "LoanPay",
      LoanID: loanId,
      Amount: String(amountDrops),
      Flags: flags,
    })
  }

  /**
   * Manage a loan server-side (LoanManage).
   * LoanManage is a BROKER action (default/impair/unimpair) → uses owner wallet.
   */
  async manageLoan({ loanId, flags }) {
    return this._signAndSubmitRaw(this.getOwnerWallet(), {
      TransactionType: "LoanManage",
      LoanID: loanId,
      Flags: flags,
    })
  }

  /**
   * Sign and submit a tx with the given wallet (single-signer XLS-66).
   */
  async _signAndSubmitRaw(wallet, tx) {
    if (!wallet) throw new Error("Signing wallet not configured")
    const client = this.connections.getClient()

    const acctInfo = await client.request({ command: "account_info", account: wallet.address })
    const ledgerInfo = await client.request({ command: "ledger_current" })
    const fee = await getCurrentFee(client)

    const prepared = {
      ...tx,
      Account: wallet.address,
      Fee: fee,
      Sequence: acctInfo.result.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
      NetworkID: 2002,
      SigningPubKey: wallet.publicKey,
    }

    prepared.TxnSignature = rawSign(encodeForSigning(prepared), wallet.privateKey)
    const tx_blob = encode(prepared)
    const result = await client.request({ command: "submit", tx_blob })
    if (result.result.engine_result !== "tesSUCCESS") {
      throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
    }

    const txHash = result.result.tx_json?.hash
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const txResult = await client.request({ command: "tx", transaction: txHash })
        if (txResult.result.validated) return { hash: txHash, result: "tesSUCCESS" }
      } catch {}
    }
    return { hash: txHash, result: "pending" }
  }

  /**
   * Get all managed vaults that have a loanBrokerId configured.
   */
  async getAvailableVaults() {
    const client = this.connections.getClient()
    const vaults = []

    for (const [vaultId, vaultConfig] of Object.entries(config.managedVaults)) {
      if (!vaultConfig.loanBrokerId) continue

      try {
        const vaultEntry = await client.request({
          command: "ledger_entry",
          index: vaultId,
        })
        const node = vaultEntry.result.node
        vaults.push({
          vaultId,
          loanBrokerId: vaultConfig.loanBrokerId,
          name: vaultConfig.name,
          asset: node.Asset || "XRP",
          availableLiquidity: node.AssetsAvailable || "0",
          totalAssets: node.AssetsTotal || "0",
          owner: node.Owner,
          brokerAccount: node.Owner,
        })
      } catch (err) {
        console.warn(`[cosign] Failed to fetch vault ${vaultId}: ${err.message}`)
      }
    }

    return vaults
  }

  /**
   * Get all loan objects for a given account.
   */
  async getLoansForAccount(account) {
    const client = this.connections.getClient()
    const result = await client.request({
      command: "account_objects",
      account,
      type: "loan",
    })
    return result.result.account_objects || []
  }

  _extractResult(txResult) {
    const loanId = txResult.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Loan"
    )?.CreatedNode?.LedgerIndex
    return {
      hash: txResult.hash,
      loanId: loanId || null,
      result: txResult.meta?.TransactionResult || txResult.engine_result,
    }
  }
}
