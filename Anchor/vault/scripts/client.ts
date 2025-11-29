import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/vault.json";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";


const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = new anchor.Program(idl as anchor.Idl, provider);

async function getVaultPda(owner: PublicKey) {
    const [vaultPda] = await PublicKey.findProgramAddress(
        [
            Buffer.from("vault"),
            owner.toBuffer(),
        ],
        program.programId
    );

    return vaultPda;
}
async function getVaultStatePda(owner: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("vault_state"),
            owner.toBuffer(),
        ],
        program.programId
    )[0];
}

export async function initializeVault() {
    const owner = provider.wallet.publicKey;
    const vaultPda = await getVaultPda(owner);
    const vaultStatePda = await getVaultStatePda(owner);

    const tx = await program.methods
        .initializeVault()
        .accounts({
            vaultState: vaultStatePda,   // FIX
            vault: vaultPda,             // OK
            owner,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log("Vault initialized:", vaultPda.toBase58());
    console.log("Tx Signature:", tx);
}

export async function deposit(amountSol: number) {
    const owner = provider.wallet.publicKey;
    const vaultPda = await getVaultPda(owner);
	const vaultStatePda = await getVaultStatePda(owner);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const tx = await program.methods
        .deposit(new anchor.BN(lamports))
        .accounts({
			vaultState: vaultStatePda,
            vault: vaultPda,
            user: owner,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log(`Deposited: ${amountSol} SOL`);
    console.log("Tx Signature:", tx);
}


export async function withdraw(amountSol: number) {
    const owner = provider.wallet.publicKey;
    const vaultPda = await getVaultPda(owner);
	const vaultStatePda = await getVaultStatePda(owner);
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const tx = await program.methods
        .withdraw(new anchor.BN(lamports))
        .accounts({
			vaultState: vaultStatePda,
            vault: vaultPda,
            owner,
			systemProgram: SystemProgram.programId
        })
        .rpc();

    console.log(`Withdrawn: ${amountSol} SOL`);
    console.log("Tx:", tx);
}


export async function closeVault() {
    const owner = provider.wallet.publicKey;
    const vaultPda = await getVaultPda(owner);
	const vaultStatePda = await getVaultStatePda(owner);
	
    const tx = await program.methods
        .closeVault()
        .accounts({
			vaultState: vaultStatePda,
            vault: vaultPda,
            owner,
			systemProgram: SystemProgram.programId
        })
        .rpc();

    console.log(`Vault closed: ${vaultPda}`);
    console.log("Tx:", tx);
}

export async function getVaultState() {
    const owner = provider.wallet.publicKey;
    const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault_state"), owner.toBuffer()],
        program.programId
    );

    try {
        const state = await program.account.vaultState.fetch(vaultStatePda);
        console.log("VaultState:", state);
        return state;
    } catch (e) {
        console.log("VaultState account not found");
        return null;
    }
}

export async function getVaultBalance() {
    const owner = provider.wallet.publicKey;
    const vaultPda = await getVaultPda(owner);

    const info = await provider.connection.getAccountInfo(vaultPda);

    if (!info) {
        console.log("Vault PDA not found");
        return 0;
    }

    console.log("Vault lamports:", info.lamports);
    return info.lamports;
}


(async () => {
    await initializeVault();
    await deposit(1);     // 1 SOL
    await getVaultState();
    await getVaultBalance();
    await withdraw(0.5);  // withdraw 0.5 SOL
    await getVaultBalance();
    await getVaultState();
    // await closeVault();
})();

