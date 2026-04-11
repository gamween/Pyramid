import { useState } from 'react';
import { useWalletManager } from './useWalletManager';
import { ADDRESSES } from '../lib/constants';

export function useTickets() {
  const { account, signAndSubmit } = useWalletManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTickets = async (count) => {
    setLoading(true);
    setError(null);
    try {
      if (!account?.address) throw new Error("Wallet not connected");
      
      const tx = {
        TransactionType: 'TicketCreate',
        Account: account.address,
        TicketCount: count
      };

      const result = await signAndSubmit(tx);
      // Wait or fetch to find out the allocated ticket sequences
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const buildPresignedOffers = (ticketSequences, pair, amountPerBuy, side) => {
    if (!account?.address) throw new Error("Wallet not connected");
    
    // Using rlUSD as base token over XRP
    const txs = ticketSequences.map((seq) => {
      let TakerPays, TakerGets;

      if (side === "BUY") {
        TakerPays = { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER, value: pair.usdAmount.toString() };
        TakerGets = amountPerBuy.toString(); // XRP drops
      } else {
        TakerPays = amountPerBuy.toString();
        TakerGets = { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER, value: pair.usdAmount.toString() };
      }

      return {
        TransactionType: 'OfferCreate',
        Account: account.address,
        Sequence: 0,
        TicketSequence: seq,
        Flags: 0x00020000, // tfImmediateOrCancel
        TakerPays,
        TakerGets
      };
    });

    return txs;
  };

  return {
    createTickets,
    buildPresignedOffers,
    loading,
    error,
  };
}
