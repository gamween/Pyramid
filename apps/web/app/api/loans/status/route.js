import { WATCHER_URL } from "../watcher-url"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const account = searchParams.get("account")
    if (!account) return Response.json({ error: "Missing account param" }, { status: 400 })
    const res = await fetch(`${WATCHER_URL}/api/loans/status?account=${account}`)
    const data = await res.json()
    if (!res.ok) return Response.json(data, { status: res.status })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: "Lending service unavailable" }, { status: 503 })
  }
}
