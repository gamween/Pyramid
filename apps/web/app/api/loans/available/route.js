import { WATCHER_URL } from "../../watcher-url"

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
