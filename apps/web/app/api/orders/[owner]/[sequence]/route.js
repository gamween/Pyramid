import { WATCHER_URL } from "../../../watcher-url.js"

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

export async function DELETE(_request, { params }) {
  try {
    const response = await fetch(`${WATCHER_URL}/api/orders/${params.owner}/${params.sequence}`, {
      method: "DELETE",
    })
    return proxyWatcherResponse(response)
  } catch (_error) {
    return watcherUnavailableResponse()
  }
}
