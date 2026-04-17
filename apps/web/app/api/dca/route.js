import { WATCHER_URL } from "../watcher-url"

export async function POST(request) {
  const body = await request.json()
  const response = await fetch(`${WATCHER_URL}/api/dca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}
