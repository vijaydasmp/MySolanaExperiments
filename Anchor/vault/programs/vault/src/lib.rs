use anchor_lang::prelude::*;
use anchor_lang::Bumps;

#[allow(deprecated)]
declare_id!("7wefq185sMy6DayVsHJag2WEr56Lg6uKYoTT16qbkNDG");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.process_initialize(&ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()>{
        ctx.accounts.process(amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>{
        ctx.accounts.process(amount)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        ctx.accounts.process_close()
    }

}

#[derive(Accounts)]
pub struct InitializeVault<'info>
{
    // 1. VaultState PDA (metadata)
    #[account(init,
        payer = owner,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault_state", owner.key().as_ref()],
        bump)]
    pub vault_state: Account<'info, VaultState>,

    // 2. Vault PDA (lamport-holding account)
    #[account(init,
        payer = owner,
        space = 8,
        seeds = [b"vault", owner.key().as_ref()],
        bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeVault<'info> {
    pub fn process_initialize(&mut self,bumps: &InitializeVaultBumps) -> Result<()> {
        // Extract bumps for your PDAs
        let state_bump = bumps.vault_state;
        let vault_bump = bumps.vault;

        let vault_state = &mut self.vault_state;

        vault_state.owner = self.owner.key();
        vault_state.vault = self.vault.key();
        vault_state.state_bump = state_bump;
        vault_state.vault_bump = vault_bump;
        vault_state.balance = 0;
        Ok(())
    }
}


// Deposit

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut,
             seeds = [b"vault_state",vault_state.owner.as_ref()],
             bump =  vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(mut,
              seeds = [b"vault", vault_state.owner.as_ref()],
              bump = vault_state.vault_bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}


impl<'info> Deposit<'info> {
    pub fn process(&mut self, amount: u64)  ->Result<()> {

        require!(amount > 0, VaultError::InvalidAmount);
        
        // Transfer lamports user → vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &self.user.key,
            &self.vault.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(&ix,
            &[
               self.user.to_account_info(),
               self.vault.to_account_info(),
            ],
        )?;

        // Update metadata
        self.vault_state.balance = self
            .vault_state
            .balance
            .checked_add(amount)
            .ok_or(VaultError::Overflow)?;

        Ok(())

    }
}

// Withdraw 

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut,
             seeds = [b"vault_state",vault_state.owner.as_ref()],
             bump =  vault_state.state_bump,
             has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(mut,
              seeds = [b"vault", vault_state.owner.as_ref()],
              bump = vault_state.vault_bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn process(&mut self, amount: u64)  ->Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        require!(self.vault_state.balance >= amount, VaultError::InsufficientFunds);

        let owner = self.owner.key();

        // Prepare PDA signer seeds
        let vault_seeds = &[
            b"vault",
            owner.as_ref(),
            &[self.vault_state.vault_bump],
        ];
        let signer_seeds = &[vault_seeds];

        // Move lamports: vault → owner
        **self.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **self.owner.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update metadata
        self.vault_state.balance = self
            .vault_state
            .balance
            .checked_sub(amount)
            .ok_or(VaultError::Overflow)?;

        Ok(())
    }
}


//Close Vault

#[derive(Accounts)]
pub struct CloseVault<'info> {
    /// Metadata PDA: will be closed and its lamports sent to `owner`
    #[account(
        mut,
        seeds = [b"vault_state", vault_state.owner.as_ref()],
        bump = vault_state.state_bump,
        has_one = owner,
        close = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    /// Vault PDA (lamports holder): will be closed and lamports sent to `owner`
    #[account(
        mut,
        seeds = [b"vault", vault_state.owner.as_ref()],
        bump = vault_state.vault_bump,
        close = owner
    )]
    pub vault: Account<'info, Vault>,

    /// Owner who receives remaining lamports and must sign
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CloseVault<'info>{
    pub fn process_close(&mut self) -> Result<()> {
        require!(
            self.vault_state.balance == 0,
            VaultError::VaultNotEmpty
        );

        require!(
           self.vault.to_account_info().lamports() == Rent::get()?.minimum_balance(8),
           VaultError::UnexpectedVaultLamports
);


        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub owner: Pubkey,   // who created/owns the vault
    pub vault: Pubkey,   // PDA address of the Vault account
    pub state_bump: u8,  // PDA bump seed
    pub vault_bump: u8,  // bump for the Vault PDA
    pub balance: u64,    // total lamports stored (bookkeeping)
}

#[account]
pub struct Vault {}

#[error_code]
pub enum VaultError {
    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Balance overflow/underflow")]
    Overflow,

    #[msg("Not enough funds in vault")]
    InsufficientFunds,


    #[msg("State bump missing")]
    MissingStateBump,

    #[msg("Vault bump missing")]
    MissingVaultBump,

    #[msg("Vault Not Empty")]
    VaultNotEmpty,

    #[msg("Unexpected Lamports")]
    UnexpectedVaultLamports    
}

