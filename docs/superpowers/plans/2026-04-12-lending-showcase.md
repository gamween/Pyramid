# Lending Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-seed 3 vaults on WASM devnet at different lifecycle stages and display them as live showcase cards on the lending page.

**Architecture:** Extend the existing `setup-devnet.mjs` script (which already raw-signs XLS-65/66 txs to bypass xrpl.js validation) to create 3 vaults instead of 1. A new `LendingShowcase` component reads on-chain state via `vault_info` RPC and renders 3 cards on the lending tab.

**Tech Stack:** xrpl.js + ripple-keypairs (raw signing), Next.js/React, Tailwind CSS, shadcn/ui

---

### Task 1: Extend setup script to create 3 vaults

**Files:**
- Modify: `apps/web/scripts/setup-devnet.mjs`

The existing script creates 1 vault + 1 loan broker. We extend it to create 3 vaults with different lifecycle states, reusing the existing `submitRawTx` helper.

- [ ] **Step 1: Refactor existing vault creation into a helper**

Extract the vault + broker creation into a reusable function. In `setup-devnet.mjs`, add this function after the existing `submitRawTx` function (around line 41):

```javascript
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
```

- [ ] **Step 2: Add loan helper functions**

Add these helpers after `createVaultWithBroker`:

```javascript
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
```

- [ ] **Step 3: Replace existing vault creation in main() with 3-vault flow**

Replace the existing vault creation block (steps 7-8 in the current script, roughly lines 121-162) and everything after it up to the DEX seeding with the 3-vault setup. The new `main()` function body after step 6 (issuing test USD) should be:

```javascript
  // ── Vault 1: Fresh Vault (ready to lend, no loans) ──
  let vault1 = { vaultId: null, loanBrokerId: null }
  try {
    vault1 = await createVaultWithBroker(client, owner, "Vault 1: Fresh Vault", 500_000_000, 50_000_000)
  } catch (err) {
    console.log(`  Vault 1 failed: ${err.message}`)
  }

  // ── Vault 2: Active Lending (outstanding loan + partial payment) ──
  let vault2 = { vaultId: null, loanBrokerId: null }
  let vault2LoanId = null
  try {
    vault2 = await createVaultWithBroker(client, owner, "Vault 2: Active Lending", 1_000_000_000, 100_000_000)

    // Fund borrower
    console.log(`\n  Funding borrower for Vault 2...`)
    const { wallet: borrower2 } = await fundWallet(client, "borrower2")

    vault2LoanId = await createLoanOnVault(client, owner, borrower2, vault2.loanBrokerId, 300_000_000)
    await payLoanPartial(client, borrower2, vault2LoanId, 50_000_000)
  } catch (err) {
    console.log(`  Vault 2 failed: ${err.message}`)
  }

  // ── Vault 3: Yield Earned (loan fully repaid, share price > 1) ──
  let vault3 = { vaultId: null, loanBrokerId: null }
  try {
    vault3 = await createVaultWithBroker(client, owner, "Vault 3: Yield Earned", 500_000_000, 50_000_000)

    // Fund borrower
    console.log(`\n  Funding borrower for Vault 3...`)
    const { wallet: borrower3 } = await fundWallet(client, "borrower3")

    const vault3LoanId = await createLoanOnVault(client, owner, borrower3, vault3.loanBrokerId, 200_000_000)
    // Full repayment — overpay slightly to cover interest
    await payLoanFull(client, borrower3, vault3LoanId, 210_000_000)
    await deleteLoan(client, owner, vault3LoanId)
  } catch (err) {
    console.log(`  Vault 3 failed: ${err.message}`)
  }
```

- [ ] **Step 4: Update DEX seeding and output**

Keep the existing DEX seeding as-is. Replace the output section (after `await client.disconnect()`) with:

```javascript
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
```

- [ ] **Step 5: Run the setup script**

```bash
cd /Users/fianso/Development/hackathons/Pyramid
node apps/web/scripts/setup-devnet.mjs
```

Expected output: 3 vault IDs printed, `devnet-addresses.json` updated with all 3 vault details. If any XLS-66 transactions fail (e.g., LoanSet needs cosigning), the error will indicate what's wrong — address in the next step.

- [ ] **Step 6: Commit**

```bash
git add apps/web/scripts/setup-devnet.mjs
git commit -m "feat: extend setup script to seed 3 showcase vaults"
```

---

### Task 2: Update constants with showcase vault IDs

**Files:**
- Modify: `apps/web/lib/constants.js`

- [ ] **Step 1: Add SHOWCASE_VAULTS to constants**

Copy the vault IDs from the setup script output into `constants.js`. Add this after the existing `ADDRESSES` export (line 45):

```javascript
export const SHOWCASE_VAULTS = [
  {
    id: "<vault1-id-from-setup-output>",
    name: "Fresh Vault",
    tagline: "Ready to Lend",
    status: "ready",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit"],
  },
  {
    id: "<vault2-id-from-setup-output>",
    name: "Active Lending",
    tagline: "Loans Outstanding",
    status: "active",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay"],
  },
  {
    id: "<vault3-id-from-setup-output>",
    name: "Yield Earned",
    tagline: "Full Lifecycle Complete",
    status: "yield",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay", "LoanDelete"],
  },
]
```

Replace `<vault1-id-from-setup-output>` etc. with the actual hex IDs from step 1.5.

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/constants.js
git commit -m "feat: add showcase vault IDs to constants"
```

---

### Task 3: Create LendingShowcase component

**Files:**
- Create: `apps/web/components/LendingShowcase.js`

- [ ] **Step 1: Create the component**

Create `apps/web/components/LendingShowcase.js`:

```jsx
"use client";

import { useState, useEffect } from "react";
import { useVault } from "../hooks/useVault";
import { SHOWCASE_VAULTS } from "../lib/constants";

const STATUS_COLORS = {
  ready: "bg-green-500",
  active: "bg-amber-500",
  yield: "bg-blue-500",
};

const STATUS_LABELS = {
  ready: "READY",
  active: "ACTIVE",
  yield: "COMPLETE",
};

function formatXrp(drops) {
  return (drops / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ShowcaseCard({ vault, info, loading, error }) {
  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">
            {vault.name}
          </h3>
          <p className="text-[10px] font-mono text-white/40 mt-1">{vault.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/50">{STATUS_LABELS[vault.status]}</span>
          <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[vault.status]} animate-pulse`} />
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 flex-1">
        {loading && (
          <div className="text-xs font-mono text-white/30 animate-pulse">Loading on-chain data...</div>
        )}
        {error && (
          <div className="text-xs font-mono text-red-400/70">Failed to fetch vault data</div>
        )}
        {info && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Total Assets</p>
                <p className="text-sm font-mono text-white">{formatXrp(info.totalAssets)} XRP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Available</p>
                <p className="text-sm font-mono text-white">{formatXrp(info.assetsAvailable)} XRP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Share Price</p>
                <p className={`text-sm font-mono ${info.sharePrice > 1 ? "text-green-400" : "text-white"}`}>
                  {info.sharePrice.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Shares</p>
                <p className="text-sm font-mono text-white">{info.totalShares.toLocaleString()}</p>
              </div>
            </div>

            {info.lossUnrealized > 0 && (
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Unrealized Loss</p>
                <p className="text-sm font-mono text-red-400">{formatXrp(info.lossUnrealized)} XRP</p>
              </div>
            )}

            {/* Utilization bar for active vaults */}
            {info.totalAssets > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] font-mono text-white/40 uppercase">Utilization</p>
                  <p className="text-[10px] font-mono text-white/60">
                    {((1 - info.assetsAvailable / info.totalAssets) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="h-1 bg-white/10 w-full">
                  <div
                    className="h-1 bg-white/60 transition-all duration-500"
                    style={{ width: `${(1 - info.assetsAvailable / info.totalAssets) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primitives footer */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <p className="text-[10px] font-mono text-white/30 uppercase mb-2">XLS-65/66 Primitives</p>
        <div className="flex flex-wrap gap-1">
          {vault.primitives.map((p) => (
            <span
              key={p}
              className="text-[9px] font-mono px-1.5 py-0.5 border border-white/15 text-white/50 bg-white/5"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LendingShowcase() {
  const { getVaultInfo } = useVault();
  const [vaultData, setVaultData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const results = {};

      await Promise.allSettled(
        SHOWCASE_VAULTS.map(async (vault) => {
          if (!vault.id) return;
          try {
            const info = await getVaultInfo(vault.id);
            if (!cancelled) results[vault.id] = { info, error: null };
          } catch (err) {
            if (!cancelled) results[vault.id] = { info: null, error: err.message };
          }
        })
      );

      if (!cancelled) {
        setVaultData(results);
        setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [getVaultInfo]);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white/60">
          Lending Showcase
        </h2>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-mono text-white/30">LIVE ON-CHAIN DATA</span>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {SHOWCASE_VAULTS.map((vault) => {
          const data = vaultData[vault.id];
          return (
            <ShowcaseCard
              key={vault.id || vault.name}
              vault={vault}
              info={data?.info || null}
              loading={loading && !data}
              error={data?.error || null}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component renders**

```bash
cd /Users/fianso/Development/hackathons/Pyramid
pnpm --filter web dev
```

Open the app, navigate to the Lending tab. The showcase section should appear below with 3 cards. If vault IDs aren't set yet, cards will show the loading/error state.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/LendingShowcase.js
git commit -m "feat: add LendingShowcase component with live vault data"
```

---

### Task 4: Wire LendingShowcase into the lending tab

**Files:**
- Modify: `apps/web/app/page.js`

- [ ] **Step 1: Add import**

Add this import at the top of `page.js`, after the existing component imports (around line 16):

```javascript
import { LendingShowcase } from "../components/LendingShowcase";
```

- [ ] **Step 2: Add LendingShowcase to the lending tab**

In the lending `TabsContent` (around line 144), add `<LendingShowcase />` after the closing `</div>` of the grid (after line 162):

The lending tab section should become:

```jsx
              {/* LENDING TAB */}
              <TabsContent value="lending" className="animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Vault Interaction (XLS-65)</h2>
                    </div>
                    <div className="p-4">
                      <VaultInteraction />
                    </div>
                  </div>
                  <div className="border border-white/20 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/20 bg-white/5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">Loan Interface (XLS-66)</h2>
                    </div>
                    <div className="p-4">
                      <LoanInteraction />
                    </div>
                  </div>
                </div>
                <LendingShowcase />
              </TabsContent>
```

- [ ] **Step 3: Verify end-to-end**

```bash
cd /Users/fianso/Development/hackathons/Pyramid
pnpm --filter web dev
```

Open the lending tab. You should see:
1. The existing Vault Interaction + Loan Interface panels at the top
2. The new "Lending Showcase" section below with 3 cards
3. Each card fetching live data from the vaults created by the setup script

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.js
git commit -m "feat: add lending showcase to lending tab"
```
