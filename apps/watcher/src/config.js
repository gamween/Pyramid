export const config = {
  devnet: {
    wss: process.env.DEVNET_WSS || "wss://wasm.devnet.rippletest.net:51233",
  },
  watcherSeed: process.env.WATCHER_SEED || "",
  vaultOwnerSeed: process.env.VAULT_OWNER_SEED || "",
  borrowerSeed: process.env.BORROWER_SEED || "",
  rlusdIssuer: process.env.RLUSD_ISSUER || "",
  port: parseInt(process.env.PORT || "3001", 10),
  managedVaults: {
    "8A84591D49EF8D1A25ABF2CE1E28DE5AA8899484392EFEDE84FA3304E109C62E": {
      loanBrokerId: "D3DDC472215038795DB31E12BBF1274847AC4A06BF3175BED25B24AE317F0256",
      name: "Fresh Vault",
    },
    "6087666E82509EFA5922ED57E87E647A78063378686195620F6445B0D36C66E2": {
      loanBrokerId: "1C767A5D27DA709451EFD264A17717BD78144CA73A4939DABB2C9BD872BCB47F",
      name: "Active Lending",
    },
    "AD7E1DB393F73284E52F90C8B960FB8FC051399521E7FC9BAE30FFCBA53C8A44": {
      loanBrokerId: "613A9F5C12DF3D44CE85E2924E778B30AE6BD65424D7050C17161365E6ED4B7F",
      name: "Yield Earned",
    },
  },
}
