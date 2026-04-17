function scheduledTradingUnavailableResponse() {
  return Response.json({ error: "Scheduled trading is not currently available" }, { status: 503 })
}

export async function POST() {
  return scheduledTradingUnavailableResponse()
}
