use risc0_zkvm::guest::env;
use sha2::{Sha256, Digest};

fn main() {
    // Read private inputs from the prover
    let trigger_price: u64 = env::read();
    let order_type: u8 = env::read();   // 0 = STOP_LOSS, 1 = TAKE_PROFIT
    let nonce: [u8; 32] = env::read();
    let current_price: u64 = env::read();

    // Compute commitment: SHA256(trigger_price || order_type || nonce)
    let mut hasher = Sha256::new();
    hasher.update(trigger_price.to_be_bytes());
    hasher.update([order_type]);
    hasher.update(nonce);
    let commitment: [u8; 32] = hasher.finalize().into();

    // Validate trigger condition
    match order_type {
        0 => assert!(current_price <= trigger_price, "SL: price not at or below trigger"),
        1 => assert!(current_price >= trigger_price, "TP: price not at or above trigger"),
        _ => panic!("invalid order type"),
    }

    // Public output: commitment (32 bytes) + current_price (8 bytes) = 40 bytes
    env::commit_slice(&commitment);
    env::commit_slice(&current_price.to_be_bytes());
}
