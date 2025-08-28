import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as borsh from "borsh";
import fs from "fs";

// --- CONFIG ---
const PROGRAM_ID = new PublicKey("AtZ8VirJpfDxRrZAQ7ko8CLc6Fdjtwo85LMSeBy6jFsw"); // replace after deploy
const SEED = Buffer.from("counter_v2");
const COUNTER_SIZE = 8; // just a u64

// --- BORSH Schema ---
class Counter {
  constructor(fields = { count: 0 }) {
    this.count = fields.count;
  }
}
const CounterSchema = new Map([
  [Counter, { kind: "struct", fields: [["count", "u64"]] }],
]);

// Instruction Enum
const INSTRUCTION = {
  Initialize: 0,
  Increment: 1,
  Decrement: 2,
  Reset: 3,
};

// --- MAIN ---
async function main() {
  // get CLI argument
  const choice = process.argv[2];
  if (!(choice in INSTRUCTION)) {
    console.error("Usage: node client.js <Initialize|Increment|Decrement|Reset>");
    process.exit(1);
  }

  // Local validator
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  // Load payer keypair
  const secret = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  // Derive PDA
  const [counterPda] = await PublicKey.findProgramAddress([SEED], PROGRAM_ID);
  console.log("Counter PDA:", counterPda.toBase58());

  // --- Helper to send instruction ---
  async function sendInstruction(ixType) {
    const instruction = Buffer.from([ixType]); // u8 enum
    const tx = new Transaction();

    // NOTE: We no longer try to create the PDA here
    // The program (Rust) will do it via invoke_signed during Initialize

    tx.add({
      keys: [
        { pubkey: counterPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: instruction,
    });

    await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`✔ Sent instruction: ${choice}`);
  }

  // send chosen instruction
  await sendInstruction(INSTRUCTION[choice]);

  // --- Fetch account data ---
  const accInfo = await connection.getAccountInfo(counterPda);
  if (accInfo) {
    const counter = borsh.deserialize(CounterSchema, Counter, accInfo.data);
    console.log("Counter value:", counter.count.toString());
  } else {
    console.log("Counter account not found");
  }
}

main().catch(console.error);
