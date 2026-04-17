import { WATCHER_URL } from "../watcher-url.js"

function watcherUnavailableResponse() {
  return Response.json({ error: "Watcher service unavailable" }, { status: 503 })
}

async function proxyWatcherResponse(response) {
  const text = await response.text()
  const trimmedText = text.trim()

  if (trimmedText.length > 0) {
    try {
      return Response.json(JSON.parse(text), { status: response.status })
    } catch (_error) {
      return Response.json(
        {
          error: "Watcher response was not valid JSON",
          upstreamText: text,
        },
        { status: response.status }
      )
    }
  }

  return Response.json({ error: "Watcher response was not valid JSON" }, { status: response.status })
}

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
  let body
  try {
    body = await request.json()
  } catch (_error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const response = await fetch(`${WATCHER_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return proxyWatcherResponse(response)
  } catch (_error) {
    return watcherUnavailableResponse()
  }
}
