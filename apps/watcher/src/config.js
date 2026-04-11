export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://alphanet.nerdnest.xyz",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
}
