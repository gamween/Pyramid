import { config } from "./config.js"

/**
 * Shared utilities for trade execution and balance tracking.
 * Used by devnet-loop.js, dca-scheduler.js, and zk-prover.js.
 */

export async function getUsdBalance(client, address) {
  const lines = await client.request({ command: "account_lines", account: address })
  return Number(lines.result.lines?.find(l => l.currency === "USD" && l.account === config.rlusdIssuer)?.balance || 0)
}

export async function getXrpBalance(client, address) {
  const info = await client.request({ command: "account_info", account: address })
  return Number(info.result.account_data.Balance)
}

/**
 * After a trade, snapshot the new balance and send the received proceeds to the user.
 * @param {object} client - Connected XRPL client
 * @param {object} wallet - Watcher wallet
 * @param {object} opts
 * @param {string} opts.side - "SELL" or "BUY"
 * @param {string} opts.destination - User r-address
 * @param {number} opts.preUsd - USD balance before trade (required if side=SELL)
 * @param {number} opts.preXrp - XRP balance before trade (required if side=BUY)
 * @param {string} opts.logPrefix - Log prefix e.g. "[devnet-loop]"
 */
export async function sendProceeds(client, wallet, { side, destination, preUsd, preXrp, logPrefix }) {
  if (side === "SELL") {
    const postUsd = await getUsdBalance(client, wallet.address)
    const received = postUsd - preUsd
    if (received > 0) {
      const usdValue = received.toFixed(6)
      console.log(`${logPrefix} Payment → ${destination} (${usdValue} USD)`)
      const payTx = {
        TransactionType: "Payment",
        Account: wallet.address,
        Destination: destination,
        Amount: { currency: "USD", issuer: config.rlusdIssuer, value: usdValue },
      }
      await client.submitAndWait(payTx, { wallet, autofill: true })
    }
  } else {
    const postXrp = await getXrpBalance(client, wallet.address)
    const received = Math.floor(postXrp - preXrp)
    if (received > 0) {
      console.log(`${logPrefix} Payment → ${destination} (${received} drops XRP)`)
      const payTx = {
        TransactionType: "Payment",
        Account: wallet.address,
        Destination: destination,
        Amount: String(received),
      }
      await client.submitAndWait(payTx, { wallet, autofill: true })
    }
  }
}
