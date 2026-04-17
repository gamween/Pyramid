import { WATCHER_URL } from "../../../watcher-url.js"

function watcherUnavailableResponse() {
  return Response.json({ error: "Watcher service unavailable" }, { status: 503 })
}

export async function DELETE(_request, { params }) {
  try {
    const response = await fetch(`${WATCHER_URL}/api/orders/${params.owner}/${params.sequence}`, {
      method: "DELETE",
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (_error) {
    return watcherUnavailableResponse()
  }
}
