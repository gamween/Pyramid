import { useState, useEffect } from 'react';
import { Client } from 'xrpl';
import { NETWORKS } from '../lib/networks';
import { ADDRESSES } from '../lib/constants';

export function usePrice() {
  const [price, setPrice] = useState(null);
  const [bid, setBid] = useState(null);
  const [ask, setAsk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let client = new Client(NETWORKS.DEVNET.wss);
    let subscribed = false;

    const fetchPrice = async () => {
      try {
        await client.connect();
        
        // Listen for new ledgers to trigger a refresh
        await client.request({
          command: 'subscribe',
          streams: ['ledger']
        });
        subscribed = true;

        const updatePrice = async () => {
          try {
            // Get orderbook or AMM for XRP/RLUSD (Assuming RLUSD is standard stable)
            // Example pair: XRP -> RLUSD
            const response = await client.request({
              command: 'book_offers',
              taker_pays: { currency: "XRP" },
              taker_gets: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER }
            });
            
            const offers = response.result.offers;
            if (offers && offers.length > 0) {
              const bestBid = parseFloat(offers[0].quality || 0); // Reverse logic depending on pair
              setBid(bestBid);
            }

            const responseAsk = await client.request({
              command: 'book_offers',
              taker_pays: { currency: "USD", issuer: ADDRESSES.RLUSD_ISSUER },
              taker_gets: { currency: "XRP" }
            });
            
            const askOffers = responseAsk.result.offers;
            if (askOffers && askOffers.length > 0) {
              const bestAsk = 1 / parseFloat(askOffers[0].quality || 1); 
              setAsk(bestAsk);
            }

            if (bid && ask) {
              setPrice((bid + ask) / 2);
            }

            setLoading(false);
          } catch (err) {
            console.error("Price fetch error:", err);
          }
        };

        client.on('ledgerClosed', async (ledger) => {
          await updatePrice();
        });

        // Initial fetch
        await updatePrice();

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPrice();

    return () => {
      if (subscribed && client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  return { price, bid, ask, loading, error };
}