export const NETWORKS = {
  DEVNET: {
    id: "devnet",
    name: "Groth5 Devnet",
    networkId: 2,
    wss: "wss://groth5.devnet.rippletest.net:51233",
    faucet: "http://groth5-faucet.devnet.rippletest.net/accounts",
    explorer: "http://custom.xrpl.org/groth5.devnet.rippletest.net",
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

// Groth5 Devnet is the single network for Tellement-French
// Supports: XLS-65/66 (lending), standard XRPL (trading), Smart Escrows + ZK (XLS-0100)
export const DEFAULT_NETWORK = NETWORKS.DEVNET;
