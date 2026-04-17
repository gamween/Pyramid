import { WATCHER_URL } from "../watcher-url.js"

function watcherUnavailableResponse() {
  return Response.json({ error: "Watcher service unavailable" }, { status: 503 })
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch (_error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const response = await fetch(`${WATCHER_URL}/api/dca`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (_error) {
    return watcherUnavailableResponse()
  }
}
