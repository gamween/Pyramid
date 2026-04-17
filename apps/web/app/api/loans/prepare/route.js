import { WATCHER_URL } from "../../watcher-url"

export async function POST(request) {
  try {
    const body = await request.json()
    const res = await fetch(`${WATCHER_URL}/api/loans/prepare`, {
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
