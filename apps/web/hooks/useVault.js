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
}
