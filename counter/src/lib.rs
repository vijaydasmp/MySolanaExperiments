use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let counter_account = next_account_info(accounts_iter)?; // first account passed in

    if counter_account.owner != _program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get the account’s data buffer
    let mut data = counter_account.try_borrow_mut_data()?;
    if data.len() < 4 {
        return Err(ProgramError::InvalidAccountData);
    }

    // Read current counter
    let mut counter = u32::from_le_bytes(data[0..4].try_into().unwrap());

    // Increment
    counter += 1;
    msg!("Counter incremented to {}", counter);

    // Write back to account data
    data[0..4].copy_from_slice(&counter.to_le_bytes());

    Ok(())
}
