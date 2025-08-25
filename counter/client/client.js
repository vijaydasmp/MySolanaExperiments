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
const programId = new PublicKey("C73UNyddrqJjQNeaVw9Sxv9xh9CJdoHGELHABkGiyGJR");

// Load counter account
const counterAccount = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("counter.json")))
);

(async () => {
  const ix = new TransactionInstruction({
    keys: [
      { pubkey: counterAccount.publicKey, isSigner: false, isWritable: true },
    ],
    programId,
    data: Buffer.alloc(0), // no data needed
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("Tx signature:", sig);
})();
