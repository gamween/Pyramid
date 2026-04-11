/**
 * T4.1 — Devnet Environment Setup
 *
 * Funds wallets, creates USD issuer, Vault, and LoanBroker on devnet.
 * Outputs addresses to paste into constants.js.
 *
 * Usage: node apps/web/scripts/setup-devnet.mjs
 */

import { Client, Wallet } from "xrpl"

const WSS = "wss://s.devnet.rippletest.net:51233"
const FAUCET = "https://faucet.devnet.rippletest.net/accounts"

async function fundWallet(client) {
  const resp = await fetch(FAUCET, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
  const data = await resp.json()
  const wallet = Wallet.fromSeed(data.account.secret)
  // Wait for account to be funded on ledger
  await new Promise((r) => setTimeout(r, 2000))
  const info = await client.request({ command: "account_info", account: wallet.address })
  console.log(`  Funded: ${wallet.address} (${info.result.account_data.Balance} drops)`)
  return { wallet, seed: data.account.secret }
}

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log("Connected to devnet\n")

  // 1. Fund protocol owner account
  console.log("1. Funding protocol owner...")
  const { wallet: owner, seed: ownerSeed } = await fundWallet(client)

  // 2. Fund RLUSD issuer account
  console.log("2. Funding RLUSD issuer...")
  const { wallet: issuer, seed: issuerSeed } = await fundWallet(client)

  // 3. Set up trust line: owner trusts issuer for USD
  console.log("\n3. Setting up USD trust line...")
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

  // 4. Issue some test USD from issuer to owner
  console.log("4. Issuing test USD to owner...")
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

  // 5. Create Vault
  console.log("\n5. Creating Vault...")
  let vaultId = null
  try {
    const vaultTx = {
      TransactionType: "VaultCreate",
      Account: owner.address,
      Asset: { currency: "XRP" },
    }
    const vaultResult = await client.submitAndWait(vaultTx, { wallet: owner })
    console.log(`  VaultCreate: ${vaultResult.result.meta.TransactionResult}`)

    const vaultNode = vaultResult.result.meta.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Vault"
    )
    vaultId = vaultNode?.CreatedNode?.LedgerIndex || null
    console.log(`  Vault ID: ${vaultId}`)
  } catch (err) {
    console.log(`  VaultCreate not available on this devnet build: ${err.message}`)
    console.log("  (XLS-65 may not be enabled yet — will use placeholder)")
  }

  // 6. Create LoanBroker
  console.log("\n6. Creating LoanBroker...")
  let loanBrokerId = null
  if (vaultId) {
    try {
      const brokerTx = {
        TransactionType: "LoanBrokerSet",
        Account: owner.address,
        VaultID: vaultId,
        ManagementFeeRate: 1000,
      }
      const brokerResult = await client.submitAndWait(brokerTx, { wallet: owner })
      console.log(`  LoanBrokerSet: ${brokerResult.result.meta.TransactionResult}`)

      const brokerNode = brokerResult.result.meta.AffectedNodes?.find(
        (n) => n.CreatedNode?.LedgerEntryType === "LoanBroker"
      )
      loanBrokerId = brokerNode?.CreatedNode?.LedgerIndex || null
      console.log(`  LoanBroker ID: ${loanBrokerId}`)
    } catch (err) {
      console.log(`  LoanBrokerSet not available: ${err.message}`)
    }
  }

  // 7. Create some offers on the DEX for price discovery
  console.log("\n7. Seeding DEX with XRP/USD offers...")
  try {
    // Sell 1000 XRP for 2340 USD (price ~2.34)
    const sellOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: { currency: "USD", issuer: issuer.address, value: "2340" },
      TakerGets: "1000000000", // 1000 XRP in drops
    }
    const sellResult = await client.submitAndWait(sellOffer, { wallet: owner })
    console.log(`  Sell offer: ${sellResult.result.meta.TransactionResult}`)

    // Buy 1000 XRP for 2300 USD (bid ~2.30)
    const buyOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: "1000000000",
      TakerGets: { currency: "USD", issuer: issuer.address, value: "2300" },
    }
    const buyResult = await client.submitAndWait(buyOffer, { wallet: owner })
    console.log(`  Buy offer: ${buyResult.result.meta.TransactionResult}`)
  } catch (err) {
    console.log(`  DEX seeding failed: ${err.message}`)
  }

  await client.disconnect()

  // Output
  console.log("\n" + "=".repeat(60))
  console.log("SETUP COMPLETE — Copy these into constants.js:")
  console.log("=".repeat(60))
  console.log(`
export const ADDRESSES = {
  VAULT_ID: "${vaultId || ""}",
  LOAN_BROKER_ID: "${loanBrokerId || ""}",
  RLUSD_ISSUER: "${issuer.address}",
}
`)
  console.log("Owner account:")
  console.log(`  Address: ${owner.address}`)
  console.log(`  Seed:    ${ownerSeed}`)
  console.log(`\nIssuer account:`)
  console.log(`  Address: ${issuer.address}`)
  console.log(`  Seed:    ${issuerSeed}`)
  console.log("\nSave these seeds — you'll need them for integration testing.")
}

main().catch(console.error)
