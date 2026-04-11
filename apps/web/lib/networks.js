export const NETWORKS = {
  DEVNET: {
    id: "devnet",
    name: "Devnet",
    networkId: 2,
    wss: "wss://s.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  },
  GROTH5: {
    id: "groth5",
    name: "Groth5 Devnet",
    networkId: 2,
    wss: "wss://groth5.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  }
};

// Devnet is primary for Pyramid (lending protocol + DEX)
export const DEFAULT_NETWORK = NETWORKS.DEVNET;
