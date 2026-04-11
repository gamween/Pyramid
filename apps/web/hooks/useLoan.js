"use client"

import { useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { useWallet } from "@/components/providers/WalletProvider"
import { LENDING } from "@/lib/constants"

async function getTxMeta(hash) {
  const client = await getClient()
  const response = await client.request({ command: "tx", transaction: hash })
  return response.result
}

export function useLoan() {
  const { walletManager } = useWallet()

  const createLoanBroker = useCallback(async (vaultId, managementFeeRate = LENDING.MANAGEMENT_FEE_RATE) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "LoanBrokerSet",
      VaultID: vaultId,
      ManagementFeeRate: managementFeeRate,
    }
    const submitted = await walletManager.signAndSubmit(tx)
    const txResult = await getTxMeta(submitted.hash)
    const loanBrokerId = txResult.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "LoanBroker"
    )?.CreatedNode?.LedgerIndex
    return { hash: submitted.hash, loanBrokerId }
  }, [walletManager])

  const depositCover = useCallback(async (loanBrokerId, amount) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "LoanBrokerCoverDeposit",
      LoanBrokerID: loanBrokerId,
      Amount: amount,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const createLoan = useCallback(async (
    loanBrokerId,
    borrowerAddress,
    principal,
    interestRate = LENDING.DEFAULT_INTEREST_RATE,
    paymentTotal = 12,
    paymentInterval = LENDING.DEFAULT_PAYMENT_INTERVAL,
    gracePeriod = LENDING.DEFAULT_GRACE_PERIOD
  ) => {
    if (!walletManager) throw new Error("Wallet not connected")
    // Broker builds and signs the LoanSet tx
    const tx = {
      TransactionType: "LoanSet",
      LoanBrokerID: loanBrokerId,
      Counterparty: borrowerAddress,
      PrincipalRequested: principal,
      InterestRate: interestRate,
      PaymentTotal: paymentTotal,
      PaymentInterval: paymentInterval,
      GracePeriod: gracePeriod,
    }
    // Broker signs first — returns { tx_blob, signature }
    const brokerSigned = await walletManager.sign(tx)
    // Return for borrower cosign
    return { tx_blob: brokerSigned.tx_blob, tx }
  }, [walletManager])

  const payLoan = useCallback(async (loanId, amount, flags = 0) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "LoanPay",
      LoanID: loanId,
      Amount: amount,
      Flags: flags,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const manageLoan = useCallback(async (loanId, action) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const flagMap = {
      default: 0x00010000,  // tfLoanDefault
      impair: 0x00020000,   // tfLoanImpair
      unimpair: 0x00040000, // tfLoanUnimpair
    }
    const tx = {
      TransactionType: "LoanManage",
      LoanID: loanId,
      Flags: flagMap[action] || 0,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const deleteLoan = useCallback(async (loanId) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "LoanDelete",
      LoanID: loanId,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const getLoanInfo = useCallback(async (loanBrokerId, loanSeq) => {
    const client = await getClient()
    const response = await client.request({
      command: "ledger_entry",
      loan: {
        loan_broker_id: loanBrokerId,
        loan_seq: loanSeq,
      },
    })
    return response.result.node
  }, [])

  return {
    createLoanBroker,
    depositCover,
    createLoan,
    payLoan,
    manageLoan,
    deleteLoan,
    getLoanInfo,
  }
}
