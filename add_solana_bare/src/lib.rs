use solana_program::{
 account_info::AccountInfo,
 entrypoint,
 entrypoint::ProgramResult,
 msg,
 pubkey::Pubkey,
};

entrypoint!{process_instruction}

pub fn process_instruction(
    _program_id : &Pubkey,
    _accounts : &[AccountInfo],
    instruction_data : &[u8], //client passess data here

) -> ProgramResult {

    if instruction_data.len() < 8 {
        msg!("Not enough data provided");
        return Ok(());
    }

    let (first_bytes,second_bytes) = instruction_data.split_at(4);
    let a = u32::from_le_bytes(first_bytes.try_into().unwrap());
    let b = u32::from_le_bytes(second_bytes.try_into().unwrap());

    let result = a + b;

    msg!("Adding numbers: {} + {} = {}", a, b, result);

    Ok(())

}
