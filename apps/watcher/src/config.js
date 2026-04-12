export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://wasm.devnet.rippletest.net:51233",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
  managedVaults: {
    "8A84591D49EF8D1A25ABF2CE1E28DE5AA8899484392EFEDE84FA3304E109C62E": {
      loanBrokerId: "356E1FF36205377B8C6074489708A9B602CCB349A910305F25CC57AE7A930432",
      name: "Fresh Vault",
    },
    "6087666E82509EFA5922ED57E87E647A78063378686195620F6445B0D36C66E2": {
      loanBrokerId: null,
      name: "Active Lending",
    },
    "AD7E1DB393F73284E52F90C8B960FB8FC051399521E7FC9BAE30FFCBA53C8A44": {
      loanBrokerId: null,
      name: "Yield Earned",
    },
  },
}
