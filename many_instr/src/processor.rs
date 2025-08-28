use solana_program::{
    account_info::{next_account_info, AccountInfo},
    msg,
    program::{invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{
    instruction::CounterInstruction,
    state::CounterAccount,
};


/// The processor struct that dispatches instructions.
pub struct Processor;

impl Processor {
    /// The main entry point for processing instructions.
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> Result<(), ProgramError> {
        // Deserialize the instruction data into our enum
        let instruction = CounterInstruction::try_from_slice(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        // Match the instruction and dispatch to the correct handler
        match instruction {
            CounterInstruction::Initialize => {
                msg!("Instruction: Initialize");
                Self::process_initialize(program_id, accounts)
            }
            CounterInstruction::Increment => {
                msg!("Instruction: Increment");
                Self::process_increment(program_id, accounts)
            }
            CounterInstruction::Decrement => {
                msg!("Instruction: Decrement");
                Self::process_decrement(program_id, accounts)
            }
            CounterInstruction::Reset => {
                msg!("Instruction: Reset");
                Self::process_reset(program_id, accounts)
            }
        }
    }

    /// Handles the Initialize instruction.
    pub fn process_initialize(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> Result<(), ProgramError> {
        msg!("processing initialize instruction");

        let account_info_iter = &mut accounts.iter();

        // accounts order: [PDA, payer, system_program]
        let counter_pda = next_account_info(account_info_iter)?;
        let payer = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        // derive PDA to verify
        let (pda, bump) = Pubkey::find_program_address(&[b"counter_v2"], program_id);
        if counter_pda.key != &pda {
            msg!("Counter PDA mismatch");
            return Err(ProgramError::InvalidSeeds);
        }

        // if not already allocated, create account
        if counter_pda.data_len() > 0 {
            msg!("Counter PDA already exists");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        msg!("Creating counter PDA...");
        let rent = Rent::get()?;
        let space = CounterAccount::LEN as u64; // Correctly get the space from the data struct
        let lamports = rent.minimum_balance(CounterAccount::LEN);

        let create_ix = system_instruction::create_account(
            payer.key,
            counter_pda.key,
            lamports,
            space,
            program_id,
        );

        // sign with PDA seeds
        invoke_signed(
            &create_ix,
            &[payer.clone(), counter_pda.clone(), system_program.clone()],
            &[&[b"counter_v2", &[bump]]],
        )?;

        // initialize data
        let counter_data = CounterAccount { count: 0 };
        counter_data.serialize(&mut &mut counter_pda.data.borrow_mut()[..])?;
        msg!("Counter initialized at 0");

        Ok(())
    }

    /// Handles increment, decrement, and reset operations
    fn process_operation(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        operation: fn(&mut CounterAccount),
    ) -> Result<(), ProgramError> {
        let account_info_iter = &mut accounts.iter();
        let counter_account = next_account_info(account_info_iter)?;

        // Security check: PDA must be owned by the program
        if counter_account.owner != program_id {
            msg!("Counter account is not owned by the program");
            return Err(ProgramError::IncorrectProgramId);
        }

        // Security check: PDA must be writable
        if !counter_account.is_writable {
            msg!("Counter account is not writable");
            return Err(ProgramError::InvalidAccountData);
        }

        // Security check: Verify the PDA matches the expected derived address
        let (pda, _bump) = Pubkey::find_program_address(&[b"counter_v2"], program_id);
        if *counter_account.key != pda {
            msg!("PDA provided does not match expected PDA");
            return Err(ProgramError::InvalidSeeds);
        }

        let mut counter_data = CounterAccount::try_from_slice(&counter_account.data.borrow())
            .map_err(|_| ProgramError::InvalidAccountData)?;

        operation(&mut counter_data);

        counter_data
            .serialize(&mut &mut counter_account.data.borrow_mut()[..])
            .map_err(|_| ProgramError::InvalidAccountData)?;

        msg!("Operation complete. Current value: {}", counter_data.count);
        Ok(())
    }

    pub fn process_increment(program_id: &Pubkey, accounts: &[AccountInfo]) -> Result<(), ProgramError> {
        msg!("processing increment instruction");
        Self::process_operation(program_id, accounts, |account| account.count += 1)
    }

    pub fn process_decrement(program_id: &Pubkey, accounts: &[AccountInfo]) -> Result<(), ProgramError> {
        msg!("processing decrement instruction");
        Self::process_operation(program_id, accounts, |account| account.count -= 1)
    }

    pub fn process_reset(program_id: &Pubkey, accounts: &[AccountInfo]) -> Result<(), ProgramError> {
        msg!("processing reset instruction");
        Self::process_operation(program_id, accounts, |account| account.count = 0)
    }
}

impl CounterAccount {
    const LEN: usize = 8;
}