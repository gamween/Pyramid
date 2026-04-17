import { WATCHER_URL } from "../../../watcher-url"

export async function DELETE(_request, { params }) {
  const response = await fetch(`${WATCHER_URL}/api/orders/${params.owner}/${params.sequence}`, {
    method: "DELETE",
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}
