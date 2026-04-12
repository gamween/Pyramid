const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function GET() {
  try {
    const res = await fetch(`${WATCHER_URL}/api/loans/available`)
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
