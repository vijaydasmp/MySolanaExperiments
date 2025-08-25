import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";

const PROGRAM_ID = new PublicKey("GmttTMjvLAXQwvjgpmS4wkiqNazQ8RHgxuZ2sUYBU28g");

async function main() {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  // Load your local wallet (id.json created by solana-keygen)
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  // Build instruction: no accounts, no data
  const instruction = new TransactionInstruction({
    keys: [],
    programId: PROGRAM_ID,
    data: Buffer.alloc(0), // empty data
  });

  const tx = new Transaction().add(instruction);

  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("✅ Transaction signature:", sig);
}

main().catch(console.error);
