import { config } from "./config.js"

export class DcaScheduler {
  async submitNext(schedule, client, wallet) {
    if (schedule.completed >= schedule.total) return null
    if (schedule.processing) return null
    if (!wallet) {
      console.error("[dca] No wallet for DCA execution")
      return null
    }

    schedule.processing = true
    try {
      // First time: EscrowFinish to get the funds
      if (!schedule.escrowFinished) {
        console.log(`[dca] EscrowFinish ${schedule.owner}:${schedule.escrowSequence}`)
        const finishTx = {
          TransactionType: "EscrowFinish",
          Account: wallet.address,
          Owner: schedule.owner,
          OfferSequence: schedule.escrowSequence,
          Condition: schedule.condition,
          Fulfillment: schedule.preimage,
        }
        const finishResult = await client.submitAndWait(finishTx, { wallet, autofill: true })
        const finishStatus = finishResult.result.meta.TransactionResult
        console.log(`[dca] EscrowFinish: ${finishStatus}`)
        if (finishStatus !== "tesSUCCESS") {
          schedule.nextSubmitTime = Date.now() + schedule.intervalMs
          return null
        }
        schedule.escrowFinished = true
      }

      const sliceDrops = schedule.perSliceAmount
      const sliceXrp = Number(sliceDrops) / 1e6

      // Snapshot balance before trade
      let preBalance
      if (schedule.side === "SELL") {
        const lines = await client.request({ command: "account_lines", account: wallet.address })
        preBalance = Number(lines.result.lines?.find(l => l.currency === "USD" && l.account === config.rlusdIssuer)?.balance || 0)
      } else {
        const info = await client.request({ command: "account_info", account: wallet.address })
        preBalance = Number(info.result.account_data.Balance)
      }

      // Fetch price from the CORRECT side of the book
      // SELL XRP → look at BID book (what buyers will pay)
      // BUY XRP → look at ASK book (what sellers want)
      let currentPrice = 0.5
      if (schedule.side === "SELL") {
        const bidResp = await client.request({
          command: "book_offers",
          taker_pays: { currency: "USD", issuer: config.rlusdIssuer },
          taker_gets: { currency: "XRP" },
          limit: 1,
        })
        if (bidResp.result.offers?.length > 0) {
          const o = bidResp.result.offers[0]
          const pays = typeof o.TakerPays === "string" ? Number(o.TakerPays) / 1e6 : Number(o.TakerPays.value)
          const gets = typeof o.TakerGets === "string" ? Number(o.TakerGets) / 1e6 : Number(o.TakerGets.value)
          currentPrice = pays / gets // USD per XRP from bid side
        }
      } else {
        const askResp = await client.request({
          command: "book_offers",
          taker_pays: { currency: "XRP" },
          taker_gets: { currency: "USD", issuer: config.rlusdIssuer },
          limit: 1,
        })
        if (askResp.result.offers?.length > 0) {
          const o = askResp.result.offers[0]
          const pays = typeof o.TakerPays === "string" ? Number(o.TakerPays) / 1e6 : Number(o.TakerPays.value)
          const gets = typeof o.TakerGets === "string" ? Number(o.TakerGets) / 1e6 : Number(o.TakerGets.value)
          currentPrice = gets / pays // USD per XRP from ask side
        }
      }

      // Slight slippage to ensure crossing (accept 2% worse price)
      const slippage = schedule.side === "SELL" ? 0.98 : 1.02
      const limitPrice = currentPrice * slippage
      const estimatedUsd = (sliceXrp * limitPrice).toFixed(6)
      console.log(`[dca] Slice ${schedule.completed + 1}/${schedule.total}: ${schedule.side} ${sliceXrp} XRP @ bid ~${currentPrice.toFixed(4)} (limit ${limitPrice.toFixed(4)})`)

      const offerTx = {
        TransactionType: "OfferCreate",
        Account: wallet.address,
        // No IOC flag — let the offer sit on the book if needed
      }
      if (schedule.side === "SELL") {
        offerTx.TakerGets = sliceDrops
        offerTx.TakerPays = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      } else {
        offerTx.TakerPays = sliceDrops
        offerTx.TakerGets = { currency: "USD", issuer: config.rlusdIssuer, value: estimatedUsd }
      }
      const offerResult = await client.submitAndWait(offerTx, { wallet, autofill: true })
      const txResult = offerResult.result.meta.TransactionResult
      console.log(`[dca] OfferCreate: ${txResult}`)

      if (txResult !== "tesSUCCESS") {
        console.log(`[dca] Trade failed (${txResult}), will retry next interval`)
        schedule.nextSubmitTime = Date.now() + schedule.intervalMs
        return null
      }

      // Send proceeds to user (balance diff, with precision fix)
      if (schedule.side === "SELL") {
        const postLines = await client.request({ command: "account_lines", account: wallet.address })
        const postUsd = Number(postLines.result.lines?.find(l => l.currency === "USD" && l.account === config.rlusdIssuer)?.balance || 0)
        const received = postUsd - preBalance
        if (received > 0) {
          const usdValue = received.toFixed(6)
          console.log(`[dca] Payment → ${schedule.owner} (${usdValue} USD)`)
          const payTx = {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: schedule.owner,
            Amount: { currency: "USD", issuer: config.rlusdIssuer, value: usdValue },
          }
          await client.submitAndWait(payTx, { wallet, autofill: true })
        }
      } else {
        const postInfo = await client.request({ command: "account_info", account: wallet.address })
        const postXrp = Number(postInfo.result.account_data.Balance)
        const received = Math.floor(postXrp - preBalance)
        if (received > 0) {
          console.log(`[dca] Payment → ${schedule.owner} (${received} drops XRP)`)
          const payTx = {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: schedule.owner,
            Amount: String(received),
          }
          await client.submitAndWait(payTx, { wallet, autofill: true })
        }
      }

      schedule.completed++
      schedule.nextSubmitTime = Date.now() + schedule.intervalMs
      console.log(`[dca] Completed ${schedule.completed}/${schedule.total}`)

      if (schedule.completed >= schedule.total) {
        schedule.status = "COMPLETED"
        console.log(`[dca] Schedule ${schedule.id} fully completed`)
      }

      return offerResult
    } catch (err) {
      console.error(`[dca] Slice failed for ${schedule.id}:`, err.message)
      schedule.nextSubmitTime = Date.now() + schedule.intervalMs
      return null
    } finally {
      schedule.processing = false
    }
  }
}
