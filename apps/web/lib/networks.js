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
    faucet: "http://groth5-faucet.devnet.rippletest.net",
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

// Devnet is primary for Tellement-French (lending + trading + DCA)
// Groth5 is used for ZK private orders only (Smart Escrows + RISC0, requires xrpl@4.5.0-smartescrow.4)
export const DEFAULT_NETWORK = NETWORKS.DEVNET;
