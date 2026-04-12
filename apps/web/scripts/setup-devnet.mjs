/**
 * T4.1 — Devnet Environment Setup
 *
 * Funds wallets, creates USD issuer, Vault, and LoanBroker on devnet.
 * Outputs addresses to devnet-addresses.json and console.
 *
 * Usage: node apps/web/scripts/setup-devnet.mjs
 */

import { Client, Wallet, encode } from "xrpl"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Raw signing — bypasses xrpl.js validation for tx types it doesn't know (XLS-66 loans)
const keypairsPath = join(dirname(fileURLToPath(import.meta.url)), "../../../node_modules/.pnpm/xrpl@4.5.0-smartescrow.4/node_modules/ripple-keypairs/dist/index.js")
const { sign: rawSign } = await import(keypairsPath)

async function submitRawTx(client, wallet, tx) {
  const acctInfo = await client.request({ command: "account_info", account: wallet.address })
  const ledgerInfo = await client.request({ command: "ledger_current" })
  const prepared = {
    ...tx,
    Fee: "12",
    Sequence: acctInfo.result.account_data.Sequence,
    LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
    NetworkID: 2002,
    SigningPubKey: wallet.publicKey,
  }
  const encoded = encode(prepared)
  prepared.TxnSignature = rawSign("53545800" + encoded, wallet.privateKey)
  const tx_blob = encode(prepared)
  const result = await client.request({ command: "submit", tx_blob })
  if (result.result.engine_result !== "tesSUCCESS") {
    throw new Error(`${result.result.engine_result}: ${result.result.engine_result_message}`)
  }
  // Wait for validation
  await new Promise((r) => setTimeout(r, 5000))
  const txResult = await client.request({ command: "tx", transaction: result.result.tx_json?.hash })
  return txResult.result
}

async function createVaultWithBroker(client, owner, label, depositDrops, coverDrops) {
  console.log(`\n--- Creating ${label} ---`)

  // VaultCreate
  console.log(`  VaultCreate...`)
  const vaultResult = await submitRawTx(client, owner, {
    TransactionType: "VaultCreate",
    Account: owner.address,
    Asset: { currency: "XRP" },
  })
  const vaultId = vaultResult.meta?.AffectedNodes?.find(
    (n) => n.CreatedNode?.LedgerEntryType === "Vault"
  )?.CreatedNode?.LedgerIndex
  console.log(`  Vault ID: ${vaultId}`)

  // VaultDeposit
  console.log(`  VaultDeposit (${depositDrops / 1_000_000} XRP)...`)
  await submitRawTx(client, owner, {
    TransactionType: "VaultDeposit",
    Account: owner.address,
    VaultID: vaultId,
    Amount: String(depositDrops),
  })

  // LoanBrokerSet
  console.log(`  LoanBrokerSet...`)
  const brokerResult = await submitRawTx(client, owner, {
    TransactionType: "LoanBrokerSet",
    Account: owner.address,
    VaultID: vaultId,
    ManagementFeeRate: 1000,
  })
  const loanBrokerId = brokerResult.meta?.AffectedNodes?.find(
    (n) => n.CreatedNode?.LedgerEntryType === "LoanBroker"
  )?.CreatedNode?.LedgerIndex
  console.log(`  LoanBroker ID: ${loanBrokerId}`)

  // LoanBrokerCoverDeposit
  console.log(`  LoanBrokerCoverDeposit (${coverDrops / 1_000_000} XRP)...`)
  await submitRawTx(client, owner, {
    TransactionType: "LoanBrokerCoverDeposit",
    Account: owner.address,
    LoanBrokerID: loanBrokerId,
    Amount: String(coverDrops),
  })

  return { vaultId, loanBrokerId }
}

async function createLoanOnVault(client, owner, borrower, loanBrokerId, principalDrops) {
  console.log(`  LoanSet (${principalDrops / 1_000_000} XRP to ${borrower.address})...`)
  const loanResult = await submitRawTx(client, owner, {
    TransactionType: "LoanSet",
    Account: owner.address,
    LoanBrokerID: loanBrokerId,
    Counterparty: borrower.address,
    PrincipalRequested: String(principalDrops),
    InterestRate: 500,
    PaymentTotal: 12,
    PaymentInterval: 2592000,
    GracePeriod: 604800,
  })
  const loanId = loanResult.meta?.AffectedNodes?.find(
    (n) => n.CreatedNode?.LedgerEntryType === "Loan"
  )?.CreatedNode?.LedgerIndex
  console.log(`  Loan ID: ${loanId}`)
  return loanId
}

async function payLoanPartial(client, borrower, loanId, amountDrops) {
  console.log(`  LoanPay partial (${amountDrops / 1_000_000} XRP)...`)
  await submitRawTx(client, borrower, {
    TransactionType: "LoanPay",
    Account: borrower.address,
    LoanID: loanId,
    Amount: String(amountDrops),
  })
}

async function payLoanFull(client, borrower, loanId, amountDrops) {
  console.log(`  LoanPay full (${amountDrops / 1_000_000} XRP)...`)
  await submitRawTx(client, borrower, {
    TransactionType: "LoanPay",
    Account: borrower.address,
    LoanID: loanId,
    Amount: String(amountDrops),
    Flags: 0x00020000, // tfLoanFullPayment
  })
}

async function deleteLoan(client, owner, loanId) {
  console.log(`  LoanDelete...`)
  await submitRawTx(client, owner, {
    TransactionType: "LoanDelete",
    Account: owner.address,
    LoanID: loanId,
  })
}

const WSS = "wss://wasm.devnet.rippletest.net:51233"
const FAUCET_HOST = "wasmfaucet.devnet.rippletest.net"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function fundWallet(client, label) {
  console.log(`  Generating wallet for ${label}...`)
  const wallet = Wallet.generate()
  console.log(`  Address: ${wallet.address}`)
  console.log(`  Requesting faucet...`)
  const result = await client.fundWallet(wallet, {
    faucetHost: FAUCET_HOST,
  })
  console.log(`  Funded ${label}: ${wallet.address} (${result.balance} XRP)`)
  return { wallet, seed: wallet.seed }
}

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log("Connected to devnet\n")

  // 1. Fund protocol owner account (multiple faucet calls for enough XRP)
  console.log("1. Funding protocol owner...")
  const { wallet: owner, seed: ownerSeed } = await fundWallet(client, "owner")
  console.log("  Topping up owner (need ~200 XRP for vaults + DEX)...")
  for (let i = 0; i < 3; i++) {
    await client.fundWallet(owner, { faucetHost: FAUCET_HOST })
    console.log(`  Top-up ${i + 1}/3 complete`)
  }

  // 2. Fund RLUSD issuer account
  console.log("\n2. Funding RLUSD issuer...")
  const { wallet: issuer, seed: issuerSeed } = await fundWallet(client, "issuer")

  // 3. Fund watcher account
  console.log("\n3. Funding watcher...")
  const { wallet: watcher, seed: watcherSeed } = await fundWallet(client, "watcher")

  // 4. Set up trust line: owner trusts issuer for USD
  console.log("\n4. Setting up USD trust line (owner)...")
  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: owner.address,
    LimitAmount: {
      currency: "USD",
      issuer: issuer.address,
      value: "1000000",
    },
  }
  const trustResult = await client.submitAndWait(trustSetTx, { wallet: owner })
  console.log(`  TrustSet: ${trustResult.result.meta.TransactionResult}`)

  // 5. Watcher also needs USD trust line (to receive trade proceeds)
  console.log("\n5. Setting up USD trust line (watcher)...")
  const watcherTrustTx = {
    TransactionType: "TrustSet",
    Account: watcher.address,
    LimitAmount: {
      currency: "USD",
      issuer: issuer.address,
      value: "1000000",
    },
  }
  const watcherTrustResult = await client.submitAndWait(watcherTrustTx, { wallet: watcher })
  console.log(`  TrustSet: ${watcherTrustResult.result.meta.TransactionResult}`)

  // 6. Issue some test USD from issuer to owner
  console.log("\n6. Issuing test USD to owner...")
  const paymentTx = {
    TransactionType: "Payment",
    Account: issuer.address,
    Destination: owner.address,
    Amount: {
      currency: "USD",
      issuer: issuer.address,
      value: "100000",
    },
  }
  const payResult = await client.submitAndWait(paymentTx, { wallet: issuer })
  console.log(`  Payment: ${payResult.result.meta.TransactionResult}`)

  // ── Vault 1: Fresh Vault (ready to lend, no loans) ──
  let vault1 = { vaultId: null, loanBrokerId: null }
  try {
    vault1 = await createVaultWithBroker(client, owner, "Vault 1: Fresh Vault", 50_000_000, 5_000_000)
  } catch (err) {
    console.log(`  Vault 1 failed: ${err.message}`)
  }

  // ── Vault 2: Active Lending (outstanding loan + partial payment) ──
  let vault2 = { vaultId: null, loanBrokerId: null }
  let vault2LoanId = null
  try {
    vault2 = await createVaultWithBroker(client, owner, "Vault 2: Active Lending", 80_000_000, 10_000_000)

    // Fund borrower
    console.log(`\n  Funding borrower for Vault 2...`)
    const { wallet: borrower2 } = await fundWallet(client, "borrower2")

    vault2LoanId = await createLoanOnVault(client, owner, borrower2, vault2.loanBrokerId, 30_000_000)
    await payLoanPartial(client, borrower2, vault2LoanId, 5_000_000)
  } catch (err) {
    console.log(`  Vault 2 failed: ${err.message}`)
  }

  // ── Vault 3: Yield Earned (loan fully repaid, share price > 1) ──
  let vault3 = { vaultId: null, loanBrokerId: null }
  try {
    vault3 = await createVaultWithBroker(client, owner, "Vault 3: Yield Earned", 50_000_000, 5_000_000)

    // Fund borrower
    console.log(`\n  Funding borrower for Vault 3...`)
    const { wallet: borrower3 } = await fundWallet(client, "borrower3")

    const vault3LoanId = await createLoanOnVault(client, owner, borrower3, vault3.loanBrokerId, 20_000_000)
    // Full repayment — overpay slightly to cover interest
    await payLoanFull(client, borrower3, vault3LoanId, 21_000_000)
    await deleteLoan(client, owner, vault3LoanId)
  } catch (err) {
    console.log(`  Vault 3 failed: ${err.message}`)
  }

  // 9. Seed DEX with XRP/USD offers
  console.log("\n9. Seeding DEX with XRP/USD offers...")
  try {
    const sellOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: { currency: "USD", issuer: issuer.address, value: "23.40" },
      TakerGets: "10000000",
    }
    const sellResult = await client.submitAndWait(sellOffer, { wallet: owner })
    console.log(`  Sell offer: ${sellResult.result.meta.TransactionResult}`)

    const buyOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: "10000000",
      TakerGets: { currency: "USD", issuer: issuer.address, value: "23.00" },
    }
    const buyResult = await client.submitAndWait(buyOffer, { wallet: owner })
    console.log(`  Buy offer: ${buyResult.result.meta.TransactionResult}`)
  } catch (err) {
    console.log(`  DEX seeding failed: ${err.message}`)
  }

  await client.disconnect()

  const results = {
    timestamp: new Date().toISOString(),
    network: WSS,
    owner: { address: owner.address, seed: ownerSeed },
    issuer: { address: issuer.address, seed: issuerSeed },
    watcher: { address: watcher.address, seed: watcherSeed },
    showcaseVaults: [
      { id: vault1.vaultId || "", loanBrokerId: vault1.loanBrokerId || "", name: "Fresh Vault" },
      { id: vault2.vaultId || "", loanBrokerId: vault2.loanBrokerId || "", name: "Active Lending", loanId: vault2LoanId || "" },
      { id: vault3.vaultId || "", loanBrokerId: vault3.loanBrokerId || "", name: "Yield Earned" },
    ],
  }

  const outputPath = join(__dirname, "devnet-addresses.json")
  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResults written to: ${outputPath}`)

  console.log("\n" + "=".repeat(60))
  console.log("SETUP COMPLETE")
  console.log("=".repeat(60))
  console.log(`
Copy SHOWCASE_VAULTS into apps/web/lib/constants.js:

export const SHOWCASE_VAULTS = [
  {
    id: "${vault1.vaultId || ""}",
    name: "Fresh Vault",
    tagline: "Ready to Lend",
    status: "ready",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit"],
  },
  {
    id: "${vault2.vaultId || ""}",
    name: "Active Lending",
    tagline: "Loans Outstanding",
    status: "active",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay"],
  },
  {
    id: "${vault3.vaultId || ""}",
    name: "Yield Earned",
    tagline: "Full Lifecycle Complete",
    status: "yield",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay", "LoanDelete"],
  },
]

Copy into apps/watcher/.env:

WATCHER_SEED=${watcherSeed}
RLUSD_ISSUER=${issuer.address}

Owner seed (save for admin): ${ownerSeed}
Issuer seed (save for testing): ${issuerSeed}
`)
}

main().catch(console.error)
