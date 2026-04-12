import { encode, encodeForSigning } from "xrpl"
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

export class CosignHandler {
  constructor(connections) {
    this.connections = connections
  }

  /**
   * Prepare a LoanSet transaction for cosigning.
   * The watcher (broker) is the Account; the borrower will add CounterpartySignature.
   */
  async prepareLoanTx({
    vaultId,
    borrowerAddress,
    principalDrops,
    interestRate = 500,
    paymentTotal = 12,
    paymentInterval = 2592000,
    gracePeriod = 604800,
  }) {
    // Validate vault is managed and has a loanBrokerId
    const vaultConfig = config.managedVaults[vaultId]
    if (!vaultConfig) {
      throw new Error(`Vault ${vaultId} is not managed by this watcher`)
    }
    if (!vaultConfig.loanBrokerId) {
      throw new Error(`Vault ${vaultId} does not have a loanBrokerId configured`)
    }

    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!wallet) throw new Error("Watcher wallet not configured")

    // Check vault liquidity
    const vaultEntry = await client.request({
      command: "ledger_entry",
      index: vaultId,
    })
    const vaultData = vaultEntry.result.node
    if (!vaultData) {
      throw new Error(`Vault ${vaultId} not found on ledger`)
    }

    // Auto-fill the LoanSet transaction
    const acctInfo = await client.request({
      command: "account_info",
      account: wallet.address,
    })
    const ledgerInfo = await client.request({
      command: "ledger_current",
    })

    const prepared = {
      TransactionType: "LoanSet",
      Account: wallet.address,
      LoanBrokerID: vaultConfig.loanBrokerId,
      Counterparty: borrowerAddress,
      PrincipalRequested: String(principalDrops),
      InterestRate: interestRate,
      PaymentTotal: paymentTotal,
      PaymentInterval: paymentInterval,
      GracePeriod: gracePeriod,
      Fee: "24",
      Sequence: acctInfo.result.account_data.Sequence,
      LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
      NetworkID: 2002,
      SigningPubKey: wallet.publicKey,
    }

    return prepared
  }

  /**
   * Cosign a prepared LoanSet tx with the borrower's signature and submit.
   * The watcher signs as broker (TxnSignature), borrower's sig goes in CounterpartySignature.
   */
  async cosignAndSubmit({ preparedTx, borrowerSignature, borrowerPubKey }) {
    // Validate the LoanBrokerID is managed
    const managedEntry = Object.entries(config.managedVaults).find(
      ([, v]) => v.loanBrokerId === preparedTx.LoanBrokerID
    )
    if (!managedEntry) {
      throw new Error(`LoanBrokerID ${preparedTx.LoanBrokerID} is not managed by this watcher`)
    }

    const client = this.connections.getClient()
    const wallet = this.connections.getWallet()
    if (!wallet) throw new Error("Watcher wallet not configured")

    // Validate Account matches watcher wallet
    if (preparedTx.Account !== wallet.address) {
      throw new Error(`Tx Account ${preparedTx.Account} does not match watcher wallet ${wallet.address}`)
    }

    // Re-autofill Sequence and LastLedgerSequence with fresh values
    const acctInfo = await client.request({
      command: "account_info",
      account: wallet.address,
    })
    const ledgerInfo = await client.request({
      command: "ledger_current",
    })
    preparedTx.Sequence = acctInfo.result.account_data.Sequence
    preparedTx.LastLedgerSequence = ledgerInfo.result.ledger_current_index + 20

    // Both parties sign encodeForSigning(tx) which prepends 0x53545800
    const signingData = encodeForSigning(preparedTx)

    // Broker (watcher) signs — standard TxnSignature
    preparedTx.TxnSignature = rawSign(signingData, wallet.privateKey)

    // Borrower cosigns — CounterpartySignature STObject with their pubkey + signature
    preparedTx.CounterpartySignature = {
      SigningPubKey: borrowerPubKey,
      TxnSignature: borrowerSignature,
    }

    const tx_blob = encode(preparedTx)
    const result = await client.request({ command: "submit", tx_blob })

    if (result.result.engine_result !== "tesSUCCESS") {
      throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
    }

    // Poll for validation
    const txHash = result.result.tx_json?.hash
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const txResult = await client.request({ command: "tx", transaction: txHash })
        if (txResult.result.validated) {
          return this._extractResult(txResult.result)
        }
      } catch {}
    }

    // Final attempt
    const txResult = await client.request({ command: "tx", transaction: txHash })
    return this._extractResult(txResult.result)
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
        vaults.push({
          vaultId,
          loanBrokerId: vaultConfig.loanBrokerId,
          name: vaultConfig.name,
          ledgerData: vaultEntry.result.node,
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
