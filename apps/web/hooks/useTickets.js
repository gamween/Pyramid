"use client"

import { useCallback } from "react"
import { useWallet } from "@/components/providers/WalletProvider"
import { ADDRESSES } from "@/lib/constants"

export function useTickets() {
  const { walletManager } = useWallet()

  const createTickets = useCallback(async (count) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const tx = {
      TransactionType: "TicketCreate",
      TicketCount: count,
    }
    const result = await walletManager.signAndSubmit(tx)

    // Extract allocated ticket sequences from metadata
    const ticketSequences = []
    const affectedNodes = result?.result?.meta?.AffectedNodes || []
    for (const node of affectedNodes) {
      if (node.CreatedNode?.LedgerEntryType === "Ticket") {
        ticketSequences.push(node.CreatedNode?.NewFields?.TicketSequence)
      }
    }
    ticketSequences.sort((a, b) => a - b)

    return { result, ticketSequences }
  }, [walletManager])

  const buildPresignedOffers = useCallback((ticketSequences, pair, amountPerBuy, side) => {
    const txs = ticketSequences.map((ticketSeq) => {
      const isBuy = side === "BUY"
      const tx = {
        TransactionType: "OfferCreate",
        TicketSequence: ticketSeq,
        Sequence: 0, // must be 0 when using TicketSequence
        Flags: 131072, // tfImmediateOrCancel
      }

      if (isBuy) {
        // Buying XRP with USD
        tx.TakerPays = amountPerBuy // XRP in drops
        tx.TakerGets = {
          currency: "USD",
          issuer: ADDRESSES.RLUSD_ISSUER,
          value: pair.usdAmount || amountPerBuy,
        }
      } else {
        // Selling XRP for USD
        tx.TakerPays = {
          currency: "USD",
          issuer: ADDRESSES.RLUSD_ISSUER,
          value: pair.usdAmount || amountPerBuy,
        }
        tx.TakerGets = amountPerBuy // XRP in drops
      }

      return tx
    })

    return txs
  }, [])

  const signAll = useCallback(async (txs) => {
    if (!walletManager) throw new Error("Wallet not connected")
    const signedBlobs = []
    for (const tx of txs) {
      const signed = await walletManager.sign(tx)
      signedBlobs.push(signed.tx_blob || signed)
    }
    return signedBlobs
  }, [walletManager])

  return { createTickets, buildPresignedOffers, signAll }
}
