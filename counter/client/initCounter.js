import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("/home/vijay/.config/solana/id.json")))
);
const programId = new PublicKey("C73UNyddrqJjQNeaVw9Sxv9xh9CJdoHGELHABkGiyGJR");

// generate counter account keypair
const counterAccount = Keypair.generate();
fs.writeFileSync("counter.json", JSON.stringify(Array.from(counterAccount.secretKey)));

(async () => {
  // how many bytes the account needs (u64 = 8 bytes for counter)
  const space = 8;
  const lamports = await connection.getMinimumBalanceForRentExemption(space);

  const createIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: counterAccount.publicKey,
    space,
    lamports,
    programId,
  });

  const tx = new Transaction().add(createIx);
  await sendAndConfirmTransaction(connection, tx, [payer, counterAccount]);

  console.log("Counter account created:", counterAccount.publicKey.toBase58());
})();
