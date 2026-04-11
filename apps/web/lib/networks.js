export const NETWORKS = {
  DEVNET: {
    id: "devnet",
    name: "Devnet",
    networkId: 2,
    wss: "wss://s.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  },
  XAHAU_TESTNET: {
    id: "xahau-testnet",
    name: "Xahau Testnet",
    networkId: 21338,
    wss: "wss://xahau-test.net",
    faucet: "https://xahau-test.net/accounts",
    explorer: "https://explorer.xahau-test.net",
  },
  GROTH5: {
    id: "groth5",
    name: "Groth5 Devnet",
    networkId: 2,
    wss: "wss://groth5.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  },
  ALPHANET: {
    id: "alphanet",
    name: "AlphaNet",
    networkId: 21465,
    wss: "wss://alphanet.nerdnest.xyz",
    faucet: "https://alphanet.faucet.nerdnest.xyz/accounts",
    explorer: "https://alphanet.xrpl.org",
  },
  TESTNET: {
    id: "testnet",
    name: "Testnet",
    networkId: 1,
    wss: "wss://s.altnet.rippletest.net:51233",
    faucet: "https://faucet.altnet.rippletest.net/accounts",
    explorer: "https://testnet.xrpl.org",
  },
};

// Devnet is primary for Pyramid (lending protocol + DEX)
export const DEFAULT_NETWORK = NETWORKS.DEVNET;
