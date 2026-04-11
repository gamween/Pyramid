use anyhow::{Context, Result};
use clap::Parser;
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts};
use risc0_verifier_xrpl_wasm::risc0::encode_seal;
use trigger_proof_builder::TRIGGER_PROOF_ELF;

#[derive(Parser)]
#[command(name = "tf-prover", about = "Generate ZK proofs for trigger price conditions")]
struct Args {
    #[arg(long)]
    trigger_price: u64,

    #[arg(long)]
    order_type: u8,

    #[arg(long)]
    nonce: String,

    #[arg(long)]
    current_price: u64,
}

fn main() -> Result<()> {
    let args = Args::parse();

    let nonce_bytes: [u8; 32] = hex::decode(&args.nonce)
        .context("nonce must be 64 hex chars")?
        .try_into()
        .map_err(|_| anyhow::anyhow!("nonce must be exactly 32 bytes"))?;

    eprintln!("[tf-prover] Building proof...");
    eprintln!("  trigger_price: {}", args.trigger_price);
    eprintln!("  order_type: {} ({})", args.order_type, if args.order_type == 0 { "STOP_LOSS" } else { "TAKE_PROFIT" });
    eprintln!("  current_price: {}", args.current_price);

    let env = ExecutorEnv::builder()
        .write(&args.trigger_price)?
        .write(&args.order_type)?
        .write(&nonce_bytes)?
        .write(&args.current_price)?
        .build()?;

    let receipt = default_prover()
        .prove_with_opts(env, TRIGGER_PROOF_ELF, &ProverOpts::groth16())
        .context("proving failed")?
        .receipt;

    let journal = receipt.journal.bytes.as_slice().to_vec();
    let seal = encode_seal(&receipt).context("seal encoding failed")?;

    eprintln!("[tf-prover] Proof generated (journal: {} bytes, seal: {} bytes)", journal.len(), seal.len());

    let memos = serde_json::json!([
        { "Memo": { "MemoData": hex::encode(&journal) } },
        { "Memo": { "MemoData": hex::encode(&seal) } }
    ]);

    println!("{}", serde_json::to_string(&memos)?);
    Ok(())
}
