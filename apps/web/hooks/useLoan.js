import { useState } from 'react';
import { Client } from 'xrpl';
import { useWalletManager } from './useWalletManager';
import { NETWORKS } from '../lib/networks';
import { LENDING, ADDRESSES } from '../lib/constants';

export function useLoan() {
  const { account, signAndSubmit } = useWalletManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admin function: Set up the Loan Broker
  const createLoanBroker = async (vaultId, managementFeeRate = LENDING.MANAGEMENT_FEE_RATE) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'LoanBrokerSet',
        Account: account.address,
        VaultID: vaultId,
        ManagementFeeRate: managementFeeRate,
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin function: Deposit Cover
  const depositCover = async (loanBrokerId, amount) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'LoanBrokerCoverDeposit',
        Account: account.address,
        LoanBrokerID: loanBrokerId,
        Amount: amount, // in drops
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Frontend: Request/Create a loan, requires broker co-sign via Watcher/API (mocked here or done off-chain)
  const createLoan = async (
    loanBrokerId,
    borrowerAddress,
    principal,
    interestRate = LENDING.DEFAULT_INTEREST_RATE,
    paymentTotal = 12,
    paymentInterval = LENDING.DEFAULT_PAYMENT_INTERVAL,
    gracePeriod = LENDING.DEFAULT_GRACE_PERIOD
  ) => {
    setLoading(true);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'LoanSet',
        Account: borrowerAddress, // Current user
        LoanBrokerID: loanBrokerId,
        PrincipalRequested: principal, // drops
        InterestRate: interestRate,
        PaymentTotal: paymentTotal,
        PaymentInterval: paymentInterval,
        GracePeriod: gracePeriod,
      };

      // Note: Ideally we prep the tx and send to broker, then both sign.
      return { tx_blob: null, tx }; 
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const payLoan = async (loanId, amount, flags = 0) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'LoanPay',
        Account: account.address,
        LoanID: loanId,
        Amount: amount, // amount to repay in drops
        Flags: flags,
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const manageLoan = async (loanId, action) => {
    setLoading(true);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      let flags = 0;
      if (action === "impair") flags = 0x00010000;
      if (action === "default") flags = 0x00020000;

      const tx = {
        TransactionType: 'LoanManage',
        Account: account.address,
        LoanID: loanId,
        Flags: flags,
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLoan = async (loanId) => {
    setLoading(true);
    try {
      if (!account?.address) throw new Error("Wallet not connected");

      const tx = {
        TransactionType: 'LoanDelete',
        Account: account.address,
        LoanID: loanId,
      };

      return await signAndSubmit(tx);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLoanInfo = async (loanBrokerId, loanSeq) => {
    const client = new Client(NETWORKS.DEVNET.wss);
    try {
      await client.connect();
      // Use ledger_entry to get loan object (index needed)
      const response = await client.request({
        command: 'ledger_entry',
        loan: {
          loan_broker_id: loanBrokerId,
          loan_sequence: loanSeq
        },
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
    createLoanBroker,
    depositCover,
    createLoan,
    payLoan,
    manageLoan,
    deleteLoan,
    getLoanInfo,
    loading,
    error,
  };
}