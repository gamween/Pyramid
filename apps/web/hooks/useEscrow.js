"use client"

import { useCallback } from "react"
import { getClient } from "@/lib/xrplClient"
import { useWallet } from "@/components/providers/WalletProvider"
import { WATCHER_ACCOUNT } from "@/lib/constants"

async function getTxMeta(hash) {
  const client = await getClient()
  const response = await client.request({ command: "tx", transaction: hash })
  return response.result
}

export function useEscrow() {
  const { walletManager } = useWallet()

  const createEscrow = useCallback(async (destination, amount, condition, cancelAfter) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "EscrowCreate",
      Destination: destination || WATCHER_ACCOUNT,
      Amount: amount,
      Condition: condition,
      CancelAfter: cancelAfter,
    }
    const submitted = await walletManager.signAndSubmit(tx)
    const txResult = await getTxMeta(submitted.hash)
    const sequence = txResult.Sequence
    const escrowId = txResult.meta?.AffectedNodes?.find(
      (n) => n.CreatedNode?.LedgerEntryType === "Escrow"
    )?.CreatedNode?.LedgerIndex
    return { hash: submitted.hash, escrowId, sequence }
  }, [walletManager])

  const finishEscrow = useCallback(async (owner, sequence, condition, fulfillment) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "EscrowFinish",
      Owner: owner,
      OfferSequence: sequence,
      Condition: condition,
      Fulfillment: fulfillment,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const cancelEscrow = useCallback(async (owner, sequence) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "EscrowCancel",
      Owner: owner,
      OfferSequence: sequence,
    }
    return await walletManager.signAndSubmit(tx)
  }, [walletManager])

  const getEscrow = useCallback(async (owner, sequence) => {
    const client = await getClient()
    const response = await client.request({
      command: "ledger_entry",
      escrow: {
        owner: owner,
        seq: sequence,
      },
    })
    return response.result.node
  }, [])

  return { createEscrow, finishEscrow, cancelEscrow, getEscrow }
}
