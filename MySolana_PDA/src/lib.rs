use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    system_instruction,
    program::{invoke_signed},
    sysvar::{rent::Rent, Sysvar},
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Counter {
    pub value: u64,
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let payer = next_account_info(accounts_iter)?;         // user paying fees
    let counter_account = next_account_info(accounts_iter)?; // PDA account
    let system_program = next_account_info(accounts_iter)?;

    // Derive PDA
    let (pda, bump) = Pubkey::find_program_address(&[b"counter"], program_id);
    assert_eq!(pda, *counter_account.key);

    // If account not initialized yet → create it
    if counter_account.data_is_empty() {
        let rent = Rent::get()?;
        let size = std::mem::size_of::<Counter>();
        let lamports = rent.minimum_balance(size);

        let seeds: &[&[u8]] = &[b"counter", &[bump]];

        invoke_signed(
            &system_instruction::create_account(
                payer.key,
                &pda,
                lamports,
                size as u64,
                program_id,
            ),
            &[payer.clone(), counter_account.clone(), system_program.clone()],
            &[seeds],
        )?;

        msg!("Counter PDA created!");
        let mut counter_data = Counter { value: 0 };
        counter_data.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;
    }

    // Load + increment counter
    let mut counter_data = Counter::try_from_slice(&counter_account.data.borrow())?;
    counter_data.value += 1;
    counter_data.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;

    msg!("Counter = {}", counter_data.value);

    Ok(())
}
