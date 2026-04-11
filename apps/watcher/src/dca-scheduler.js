export class DcaScheduler {
  async submitNext(schedule, client) {
    if (schedule.completed >= schedule.total) return null

    const blob = schedule.signedBlobs[schedule.completed]
    try {
      const result = await client.submit(blob)
      console.log(`[dca] Submitted ${schedule.completed + 1}/${schedule.total}: ${result.result.engine_result}`)
      schedule.completed++
      schedule.nextSubmitTime = Date.now() + schedule.intervalMs
      if (schedule.completed >= schedule.total) {
        schedule.status = "COMPLETED"
        console.log(`[dca] Schedule ${schedule.id} completed`)
      }
      return result
    } catch (err) {
      console.error(`[dca] Submit failed for ${schedule.id}:`, err.message)
      return null
    }
  }
}
