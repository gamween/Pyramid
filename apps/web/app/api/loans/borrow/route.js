const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"

export async function POST(request) {
  try {
    const body = await request.json()
    const res = await fetch(`${WATCHER_URL}/api/loans/borrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
