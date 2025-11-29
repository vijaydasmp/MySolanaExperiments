import * as anchor from "@coral-xyz/anchor";
import { Idl } from "@coral-xyz/anchor"; // Added this import
import idl from "../target/idl/vault.json";
import { Vault } from "../target/types/vault";


import {
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Correct program constructor
const program = new anchor.Program<Vault>(idl as Idl, provider);


// ------------------ PDA HELPERS --------------------

function getVaultPda(owner: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), owner.toBuffer()],
        program.programId
    )[0];
}

function getVaultStatePda(owner: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vault_state"), owner.toBuffer()],
        program.programId
    )[0];
}

// ------------------ INSTRUCTIONS --------------------

export async function initializeVault() {
    const owner = provider.wallet.publicKey;
    const vault = getVaultPda(owner);
    const vaultState = getVaultStatePda(owner);

    const tx = await program.methods
        .initializeVault()
        .accounts(
            { // Added 'as any' here
                vaultState,
                vault,
                owner,
                systemProgram: SystemProgram.programId,
            } as any
        )
        .rpc();

    console.log("Vault initialized:", vault.toBase58());
    console.log("Tx:", tx);
}

export async function deposit(amountSol: number) {
    const owner = provider.wallet.publicKey;
    const vault = getVaultPda(owner);
    const vaultState = getVaultStatePda(owner);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const tx = await program.methods
        .deposit(new anchor.BN(lamports))
        .accounts(
            { // Added 'as any' here
                vaultState,
                vault,
                user: owner,
                systemProgram: SystemProgram.programId,
            } as any
        )
        .rpc();

    console.log(`Deposited ${amountSol} SOL`);
    console.log("Tx:", tx);
}

export async function withdraw(amountSol: number) {
    const owner = provider.wallet.publicKey;
    const vault = getVaultPda(owner);
    const vaultState = getVaultStatePda(owner);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const tx = await program.methods
        .withdraw(new anchor.BN(lamports))
        .accounts(
            { // Added 'as any' here
                vaultState,
                vault,
                owner,
                systemProgram: SystemProgram.programId,
            } as any
        )
        .rpc();

    console.log(`Withdrawn ${amountSol} SOL`);
    console.log("Tx:", tx);
}

export async function closeVault() {
    const owner = provider.wallet.publicKey;
    const vault = getVaultPda(owner);
    const vaultState = getVaultStatePda(owner);

    const tx = await program.methods
        .closeVault()
        .accounts(
            { // Added 'as any' here
                vaultState,
                vault,
                owner,
                systemProgram: SystemProgram.programId,
            } as any
        )
        .rpc();

    console.log("Vault closed");
    console.log("Tx:", tx);
}

// ------------------ READERS --------------------

export async function getVaultState() {
    const owner = provider.wallet.publicKey;
    const vaultStatePda = getVaultStatePda(owner);

    try {
        // This line was already fine because `fetch` expects a PublicKey
        const state = await program.account.vaultState.fetch(vaultStatePda);
        console.log("VaultState:", state);
        return state;
    } catch {
        console.log("VaultState not found");
        return null;
    }
}

export async function getVaultBalance() {
    const owner = provider.wallet.publicKey;
    const vault = getVaultPda(owner);

    const info = await provider.connection.getAccountInfo(vault);
    console.log("Vault lamports:", info?.lamports ?? 0);
    return info?.lamports ?? 0;
}

// ------------------ MAIN --------------------

(async () => {
    //await initializeVault();
    await deposit(1);
    await getVaultState();
    await getVaultBalance();
    await withdraw(0.5);
    await getVaultBalance();
    await getVaultState();
})();