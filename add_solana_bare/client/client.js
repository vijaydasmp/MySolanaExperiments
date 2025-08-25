import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import fs from "fs";

// Replace with your deployed program ID
const PROGRAM_ID = new PublicKey("FSDusoFa3srZY5Ut2DahM8xTCsWL2FdYFymDg8CSjw4W");

async function main() {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  // Load your wallet (payer)
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("/home/vijay/.config/solana/id.json", "utf8")))
  );

  // Example input numbers
  const a = 7;
  const b = 5;
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32LE(a, 0);
  buffer.writeUInt32LE(b, 4);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [],
    data: buffer,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);

  console.log("Transaction signature:", sig);
  console.log("Check logs with: solana logs");
}

main().catch(console.error);
