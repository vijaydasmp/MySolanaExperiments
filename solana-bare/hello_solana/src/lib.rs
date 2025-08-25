use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana bare program!");

    let accounts_iter = &mut accounts.iter();
    if let Ok(signer) = next_account_info(accounts_iter) {
        msg!("Signer: {}", signer.key);
    }

    if !instruction_data.is_empty() {
        msg!("Instruction data: {:?}", instruction_data);
    }

    Ok(())
}