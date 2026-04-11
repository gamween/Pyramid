import { useState } from 'react';
import { Client } from 'xrpl';
import { useWalletManager } from './useWalletManager';
import { NETWORKS } from '../lib/networks';
import { WATCHER_ACCOUNT } from '../lib/constants';

export function useEscrow() {
  const { account, signAndSubmit } = useWalletManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createEscrow = async (destination, amount, condition, cancelAfter, finishFunction = null, data = null) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const dest = destination || WATCHER_ACCOUNT;
      if (!dest) throw new Error("Watcher account not configured");

      const tx = {
        TransactionType: 'EscrowCreate',
        Account: account.address,
        Destination: dest,
        Amount: amount, // drops
        Condition: condition, // Hex SHA-256
        CancelAfter: cancelAfter, // Ripple epoch timestamp
      };

      // For ZK Smart Escrows on Groth5
      if (finishFunction) {
        tx.FinishFunction = finishFunction;
        tx.Data = data; // Hex encoded commitment
      }

      const result = await signAndSubmit(tx);
      
      // Attempt to extract escrow sequence from result if needed
      return { 
        hash: result.hash, 
        sequence: result.tx_json?.Sequence || result.Sequence 
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelEscrow = async (owner, sequence) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'EscrowCancel',
        Account: account.address,
        Owner: owner,
        OfferSequence: sequence,
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getEscrow = async (owner, sequence) => {
    const client = new Client(NETWORKS.DEVNET.wss);
    try {
      await client.connect();
      const response = await client.request({
        command: 'ledger_entry',
        escrow: {
          owner,
          seq: sequence
        }
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
    createEscrow,
    cancelEscrow,
    getEscrow,
    loading,
    error,
  };
}
