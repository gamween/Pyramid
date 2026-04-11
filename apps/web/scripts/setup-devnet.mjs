/**
 * T4.1 — Devnet Environment Setup
 *
 * Funds wallets, creates USD issuer, Vault, and LoanBroker on devnet.
 * Outputs addresses to devnet-addresses.json and console.
 *
 * Usage: node apps/web/scripts/setup-devnet.mjs
 */

import { Client, Wallet } from "xrpl"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const WSS = "wss://groth5.devnet.rippletest.net:51233"
const FAUCET = "http://groth5-faucet.devnet.rippletest.net/accounts"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function fundWallet(client, label) {
  console.log(`  Requesting faucet for ${label}...`)
  const resp = await fetch(FAUCET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!resp.ok) throw new Error(`Faucet failed: ${resp.status} ${resp.statusText}`)
  const data = await resp.json()
  const wallet = Wallet.fromSeed(data.account.secret)
  await new Promise((r) => setTimeout(r, 3000))
  const info = await client.request({ command: "account_info", account: wallet.address })
  console.log(`  Funded ${label}: ${wallet.address} (${info.result.account_data.Balance} drops)`)
  return { wallet, seed: data.account.secret }
}

async function main() {
  const client = new Client(WSS, { connectionTimeout: 20000 })
  await client.connect()
  console.log("Connected to devnet\n")

  // 1. Fund protocol owner account
  console.log("1. Funding protocol owner...")
  const { wallet: owner, seed: ownerSeed } = await fundWallet(client, "owner")

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

  // 7. Create Vault
  console.log("\n7. Creating Vault...")
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
    console.log(`  VaultCreate failed: ${err.message}`)
    console.log("  (XLS-65 may not be enabled on this devnet build)")
  }

  // 8. Create LoanBroker
  console.log("\n8. Creating LoanBroker...")
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
      console.log(`  LoanBrokerSet failed: ${err.message}`)
    }
  }

  // 9. Seed DEX with XRP/USD offers
  console.log("\n9. Seeding DEX with XRP/USD offers...")
  try {
    const sellOffer = {
      TransactionType: "OfferCreate",
      Account: owner.address,
      TakerPays: { currency: "USD", issuer: issuer.address, value: "2340" },
      TakerGets: "1000000000",
    }
    const sellResult = await client.submitAndWait(sellOffer, { wallet: owner })
    console.log(`  Sell offer: ${sellResult.result.meta.TransactionResult}`)

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

  // Write results to JSON
  const results = {
    timestamp: new Date().toISOString(),
    network: WSS,
    owner: { address: owner.address, seed: ownerSeed },
    issuer: { address: issuer.address, seed: issuerSeed },
    watcher: { address: watcher.address, seed: watcherSeed },
    vaultId: vaultId || "",
    loanBrokerId: loanBrokerId || "",
  }

  const outputPath = join(__dirname, "devnet-addresses.json")
  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResults written to: ${outputPath}`)

  console.log("\n" + "=".repeat(60))
  console.log("SETUP COMPLETE")
  console.log("=".repeat(60))
  console.log(`
Copy into apps/web/lib/constants.js:

export const WATCHER_ACCOUNT = "${watcher.address}"

export const ADDRESSES = {
  VAULT_ID: "${vaultId || ""}",
  LOAN_BROKER_ID: "${loanBrokerId || ""}",
  RLUSD_ISSUER: "${issuer.address}",
}

Copy into apps/watcher/.env:

WATCHER_SEED=${watcherSeed}
RLUSD_ISSUER=${issuer.address}

Owner seed (save for admin): ${ownerSeed}
Issuer seed (save for testing): ${issuerSeed}
`)
}

main().catch(console.error)
