<<<<<<< HEAD
import { useState } from 'react';
import { Client } from 'xrpl';
import { useWalletManager } from './useWalletManager';
import { NETWORKS } from '../lib/networks';

export function useVault() {
  const { account, signAndSubmit } = useWalletManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Note: createVault is typically an admin setup script, but here's the transaction
  const createVault = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'VaultCreate',
        Account: account.address,
        // Assuming XRP vault. For tokens, we'd add Asset: { currency, issuer }
      };

      const result = await signAndSubmit(tx);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (vaultId, amount) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");
      
      const tx = {
        TransactionType: 'VaultDeposit',
        Account: account.address,
        VaultID: vaultId,
        Amount: amount, // in drops for XRP
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (vaultId, amount) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");
      
      const tx = {
        TransactionType: 'VaultWithdraw',
        Account: account.address,
        VaultID: vaultId,
        Amount: amount, // share amount
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVaultInfo = async (vaultId) => {
    const client = new Client(NETWORKS.DEVNET.wss);
    try {
      await client.connect();
      // Use ledger_entry to get vault object
      const response = await client.request({
        command: 'ledger_entry',
        vault: vaultId,
      });
      return response.result.node;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      client.disconnect();
    }
  };

  return {
    createVault,
    deposit,
    withdraw,
    getVaultInfo,
    loading,
    error,
  };
=======
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
      command: "vault_info",
      vault_id: vaultId,
    })
    const vault = response.result.vault
    const totalAssets = Number(vault.AssetsTotal)
    const lossUnrealized = Number(vault.LossUnrealized || 0)
    const totalShares = Number(vault.shares?.OutstandingAmount || "0")
    const scale = vault.Scale || 0
    const sigma = Math.pow(10, scale)

    // sharePrice = (AssetsTotal - LossUnrealized) / OutstandingAmount
    const sharePrice = totalShares > 0
      ? (totalAssets - lossUnrealized) / totalShares
      : 1 / sigma // initial price before any deposits

    return {
      totalAssets,
      assetsAvailable: Number(vault.AssetsAvailable),
      assetsMaximum: Number(vault.AssetsMaximum || 0),
      lossUnrealized,
      totalShares,
      sharePrice,
      owner: vault.Owner,
      account: vault.Account,
      mptIssuanceId: vault.ShareMPTID,
      scale,
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
>>>>>>> a2d7721e28e1ca4268852055346c96e63bb7bb04
}
