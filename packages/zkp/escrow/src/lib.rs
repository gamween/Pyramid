#![no_std]
#![no_main]

use risc0_verifier_xrpl_wasm::{Proof, risc0};
use xrpl_wasm_stdlib::core::locator::Locator;
use xrpl_wasm_stdlib::host::get_tx_nested_field;
use xrpl_wasm_stdlib::sfield;
use trigger_proof_builder::TRIGGER_PROOF_ID;

const JOURNAL_LEN: usize = 40;
const SEAL_LEN: usize = 256;

/// Read a memo's MemoData from the EscrowFinish transaction.
/// Path: Memos -> [index] -> Memo -> MemoData
fn get_memo<const LEN: usize>(idx: i32) -> Option<[u8; LEN]> {
    let mut locator = Locator::new();
    locator.pack(sfield::Memos);
    locator.pack(idx);
    locator.pack(sfield::Memo);
    locator.pack(sfield::MemoData);

    let mut buf = [0u8; LEN];
    let len = unsafe {
        get_tx_nested_field(locator.as_ptr(), locator.len(), buf.as_mut_ptr(), LEN)
    };
    if len == LEN as i32 { Some(buf) } else { None }
}

#[unsafe(no_mangle)]
pub extern "C" fn finish() -> i32 {
    // Read journal (40 bytes) and seal (256 bytes) from EscrowFinish Memos
    let journal: [u8; JOURNAL_LEN] = match get_memo(0) {
        Some(j) => j,
        None => return 0,
    };
    let seal: [u8; SEAL_LEN] = match get_memo(1) {
        Some(s) => s,
        None => return 0,
    };

    // Verify RISC0 proof
    let proof = match Proof::from_seal_bytes(&seal) {
        Ok(p) => p,
        Err(_) => return 0,
    };
    let journal_digest = risc0::hash_journal(&journal);
    if risc0::verify(&proof, &bytemuck::cast(TRIGGER_PROOF_ID), &journal_digest).is_err() {
        return 0;
    }

    1 // proof valid — release funds
}
