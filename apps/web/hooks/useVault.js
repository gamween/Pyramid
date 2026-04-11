"use client"

import { useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { useWallet } from "@/components/providers/WalletProvider"

async function getTxMeta(hash) {
  const client = await getClient()
  const response = await client.request({ command: "tx", transaction: hash })
  return response.result
}

export function useVault() {
  const { walletManager } = useWallet()

  const createVault = useCallback(async (asset, metadata = {}) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "VaultCreate",
      Asset: asset,
      ...metadata,
    }
    const submitted = await walletManager.signAndSubmit(tx)
    const txResult = await getTxMeta(submitted.hash)
    const vaultId = txResult.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Vault"
    )?.CreatedNode?.LedgerIndex
    return { hash: submitted.hash, vaultId }
  }, [walletManager])

  const deposit = useCallback(async (vaultId, amount) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "VaultDeposit",
      VaultID: vaultId,
      Amount: amount,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const withdraw = useCallback(async (vaultId, amount) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "VaultWithdraw",
      VaultID: vaultId,
      Amount: amount,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const getVaultInfo = useCallback(async (vaultId) => {
    const client = await getClient()
    const response = await client.request({
      command: "ledger_entry",
      vault: vaultId,
    })
    const vault = response.result.node
    return {
      totalAssets: vault.AssetsTotal,
      assetsAvailable: vault.AssetsAvailable,
      lossUnrealized: vault.LossUnrealized,
      owner: vault.Owner,
      mptIssuanceId: vault.ShareMPTID,
    }
  }, [])

  const getShareBalance = useCallback(async (vaultId, account) => {
    const vaultInfo = await getVaultInfo(vaultId)
    if (!vaultInfo.mptIssuanceId) return "0"

    const client = await getClient()
    const response = await client.request({
      command: "ledger_entry",
      mptoken: {
        mpt_issuance_id: vaultInfo.mptIssuanceId,
        account: account,
      },
    })
    return response.result.node?.MPTAmount || "0"
  }, [getVaultInfo])

  return { createVault, deposit, withdraw, getVaultInfo, getShareBalance }
}
