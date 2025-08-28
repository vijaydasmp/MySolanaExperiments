Solana Counter Program
A simple Solana smart contract written in Rust that demonstrates a basic counter with multiple instructions and a Program Derived Address (PDA) for persistent storage.

Introduction
This program is a foundational example of a Solana smart contract. It showcases how to manage state on-chain using a Program Derived Address (PDA), which serves as a secure, program-owned data account. The program's logic is structured into distinct files, following best practices for code organization and clarity.

Features
Initialize: Creates and initializes the PDA account, setting the counter to 0.

Increment: Increases the counter's value by 1.

Decrement: Decreases the counter's value by 1.

Reset: Resets the counter's value back to 0.

Secure State: The counter's state is stored in a PDA, meaning it can only be modified by this program.

Project Structure
src/

entrypoint.rs: The main entry point for the program. The Solana runtime calls the process_instruction function in this file to begin execution.

processor.rs: Contains the core business logic. It receives the instruction data, validates the accounts, and dispatches the request to the appropriate handler function for each instruction (e.g., process_initialize, process_increment). This file is also responsible for PDA derivation and signing.

instruction.rs: Defines the CounterInstruction enum, which represents the different types of actions the program can perform (Initialize, Increment, Decrement, Reset). This is how the client tells the program what to do.

state.rs: Defines the data structure (CounterAccount) that holds the program's state on-chain. In this case, it's a simple i64 for the counter. It also includes the Borsh derive macros for serialization.

Prerequisites
Rust: Install Rust and rustup.

Solana CLI: Follow the Solana documentation to install the CLI.

cargo-build-bpf: Install the Solana BPF toolchain to build the program.

cargo install-bpf

Build and Deploy
Build the program: Navigate to the root of the project and run the build command.

cargo build-bpf --release

Deploy to a local validator or Devnet:

Start a local test validator:

solana-test-validator

Deploy your program:

solana program deploy target/deploy/your_program_name.so

The command will output the program ID, which you will need to use in your client-side application.

Client Usage
The client application (e.g., a TypeScript or Python script) will need to:

Derive the PDA: Use the same seeds and program ID as the smart contract to derive the correct PDA. The PDA for this program is derived from the string "counter_v2".

Create Instructions: Construct a TransactionInstruction for each operation (Initialize, Increment, etc.) with the serialized instruction data and the required accounts.

Send the Transaction: Send the transaction to the Solana network.

Fetch and Decode Data: After sending a transaction, you can fetch the PDA's account data and deserialize it using a library like borsh to read the counter's value.
