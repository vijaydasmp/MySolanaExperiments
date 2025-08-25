import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("/home/vijay/.config/solana/id.json")))
);

// Your deployed program ID
const programId = new PublicKey("C73UNyddrqJjQNeaVw9Sxv9xh9CJdoHGELHABkGiyGJR");

// Derive PDA
const [counterPDA] = await PublicKey.findProgramAddress(
  [Buffer.from("counter")],
  programId
);

(async () => {
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },   // payer
      { pubkey: counterPDA, isSigner: false, isWritable: true },       // PDA
      { pubkey: PublicKey.default, isSigner: false, isWritable: false }, // system_program
    ],
    programId,
    data: Buffer.alloc(0), // no instruction data needed
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("Tx signature:", sig);

  // Fetch PDA data
  const accountInfo = await connection.getAccountInfo(counterPDA);
  console.log("Raw data:", accountInfo.data);
})();
