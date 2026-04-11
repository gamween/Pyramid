export const NETWORKS = {
  DEVNET: {
    id: "devnet",
    name: "Groth5 Devnet",
    networkId: 2,
    wss: "wss://groth5.devnet.rippletest.net:51233",
    faucet: "http://groth5-faucet.devnet.rippletest.net",
    explorer: "http://custom.xrpl.org/groth5.devnet.rippletest.net",
  },
};

// Groth5 Devnet is the single network for Tellement-French
// Supports: XLS-65/66 (lending), standard XRPL (trading), Smart Escrows + ZK (XLS-0100)
export const DEFAULT_NETWORK = NETWORKS.DEVNET;
