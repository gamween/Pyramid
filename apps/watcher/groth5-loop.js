require('dotenv').config();
// Usage of xrpl@4.5.0-smartescrow.4
const { Client } = require('xrpl-smartescrow');

const GROTH5_WSS = "wss://groth5.devnet.rippletest.net:51233";

class Groth5Watcher {
  constructor() {
    this.client = new Client(GROTH5_WSS);
  }

  async start() {
    await this.client.connect();
    console.log("Watcher connected to Groth5");
  }

  async executePrivateOrder(escrowSequence, owner, proofJournal, proofSeal) {
    // 1. Execute FinishFunction
    // 2. Submit EscrowFinish on Groth5
    // 3. Memos contain journal + seal
    const finishTx = {
      TransactionType: "EscrowFinish",
      Account: this.client.wallet?.address,
      Owner: owner,
      OfferSequence: escrowSequence,
      ComputationAllowance: 1000000,
      Memos: [
        {
          Memo: {
            MemoData: proofJournal,
            MemoFormat: "hex",
            MemoType: "journal"
          }
        },
        {
          Memo: {
            MemoData: proofSeal,
            MemoFormat: "hex",
            MemoType: "seal"
          }
        }
      ]
    };
    
    console.log("Executing private order...");
  }
}

// In reality, Groth5Watcher is called from devnet-loop.js when a ZK private order triggers.
module.exports = { Groth5Watcher };
