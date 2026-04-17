import { WATCHER_URL } from "../watcher-url"

export async function GET() {
  try {
    const response = await fetch(`${WATCHER_URL}/api/orders`)
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (_error) {
    return Response.json({ orders: {}, dcaSchedules: {} }, { status: 200 })
  }
}

export async function POST(request) {
  const body = await request.json()
  const response = await fetch(`${WATCHER_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}
