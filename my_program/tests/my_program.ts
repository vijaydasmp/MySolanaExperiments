import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { Keypair } from "@solana/web3.js";

describe("my_program", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProgram as Program<MyProgram>;

  // Create a new keypair for our account
  const myAccount = Keypair.generate();

  it("Is initialized!", async () => {
    await program.methods
      .initialize(new anchor.BN(42)) // 👈 pass the u64 value
      .accounts({
        myAccount: myAccount.publicKey, // 👈 matches your Rust `my_account`
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([myAccount])
      .rpc();

    // Fetch and check stored data
    const account = await program.account.myAccount.fetch(myAccount.publicKey);
    console.log("Stored data:", account.data.toString()); // should be 42
  });
});
