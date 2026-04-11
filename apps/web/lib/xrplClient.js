import { Client } from "xrpl"
import { DEFAULT_NETWORK } from "./networks"

let client = null

export async function getClient() {
  if (!client || !client.isConnected()) {
    client = new Client(DEFAULT_NETWORK.wss)
    await client.connect()
  }
  return client
}

export async function disconnectClient() {
  if (client) await client.disconnect()
  client = null
}
