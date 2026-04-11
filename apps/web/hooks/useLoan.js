"use client"

import { useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { useWallet } from "@/components/providers/WalletProvider"
import { LENDING } from "@/lib/constants"

export function useLoan() {
  const { walletManager } = useWallet()

  const createLoanBroker = useCallback(async (vaultId, managementFeeRate = LENDING.MANAGEMENT_FEE_RATE) => {
    const tx = {
      TransactionType: "LoanBrokerSet",
      VaultID: vaultId,
      ManagementFeeRate: managementFeeRate,
    }
    const result = await walletManager.signAndSubmit(tx)
    const loanBrokerId = result?.result?.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "LoanBroker"
    )?.CreatedNode?.LedgerIndex
    return { result, loanBrokerId }
  }, [walletManager])

  const depositCover = useCallback(async (loanBrokerId, amount) => {
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
    // Step 1: Broker builds and signs the LoanSet tx
    const tx = {
      TransactionType: "LoanSet",
      LoanBrokerID: loanBrokerId,
      Destination: borrowerAddress,
      PrincipalRequested: principal,
      InterestRate: interestRate,
      PaymentTotal: paymentTotal,
      PaymentInterval: paymentInterval,
      GracePeriod: gracePeriod,
    }
    // Broker signs first
    const brokerSigned = await walletManager.sign(tx)
    // Return for borrower cosign — borrower uses xrpl.signLoanSetByCounterparty
    return { brokerSigned, tx }
  }, [walletManager])

  const payLoan = useCallback(async (loanId, amount, flags = 0) => {
    const tx = {
      TransactionType: "LoanPay",
      LoanID: loanId,
      Amount: amount,
      Flags: flags,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const manageLoan = useCallback(async (loanId, action) => {
    const flagMap = {
      impair: 0x00000001,   // tfLoanImpair
      default: 0x00000002,  // tfLoanDefault
      unimpair: 0x00000004, // tfLoanUnimpair
    }
    const tx = {
      TransactionType: "LoanManage",
      LoanID: loanId,
      Flags: flagMap[action] || 0,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const deleteLoan = useCallback(async (loanId) => {
    const tx = {
      TransactionType: "LoanDelete",
      LoanID: loanId,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const getLoanInfo = useCallback(async (loanId) => {
    const client = await getClient()
    const response = await client.request({
      command: "ledger_entry",
      loan: loanId,
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
