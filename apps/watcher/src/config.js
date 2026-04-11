export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://s.devnet.rippletest.net:51233",
  },
  groth5: {
    wss: process.env.GROTH5_WSS || "wss://groth5.devnet.rippletest.net:51233",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
}
