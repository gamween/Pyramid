"use client"

import { useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { useWallet } from "@/components/providers/WalletProvider"

export function useVault() {
  const { walletManager } = useWallet()

  const createVault = useCallback(async (asset, metadata = {}) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "VaultCreate",
      Asset: asset,
      ...metadata,
    }
    const result = await walletManager.signAndSubmit(tx)
    const vaultId = result?.result?.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Vault"
    )?.CreatedNode?.LedgerIndex
    return { result, vaultId }
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
      command: "vault_info",
      vault_id: vaultId,
    })
    const vault = response.result.vault
    return {
      totalAssets: vault.Asset,
      totalShares: vault.MPTokenIssuanceID ? vault.ShareCount : "0",
      sharePrice: vault.SharePrice || "1",
      owner: vault.Owner,
      mptIssuanceId: vault.MPTokenIssuanceID,
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
