export const TIMEFRAME_TO_MS = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1D": 86_400_000,
}

export function bucketTimestamp(timestamp, timeframe) {
  const width = TIMEFRAME_TO_MS[timeframe]
  if (!width) throw new Error(`Unsupported timeframe: ${timeframe}`)
  return Math.floor(timestamp / width) * width
}
