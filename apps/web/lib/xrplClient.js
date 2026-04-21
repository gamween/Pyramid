import { Client } from "xrpl"
import { DEFAULT_NETWORK } from "./networks"

let client = null

export async function getClient() {
  if (!client || !client.isConnected()) {
    const c = new Client(DEFAULT_NETWORK.wss)
    await c.connect()
    client = c
  }
  return client
}

export async function disconnectClient() {
  if (client) await client.disconnect()
  client = null
}

export async function requestXRPL(request) {
  const activeClient = await getClient()
  return activeClient.request(request)
}
