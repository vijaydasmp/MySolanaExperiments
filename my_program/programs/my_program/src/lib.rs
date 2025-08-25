use anchor_lang::prelude::*;

declare_id!("HwUhqazwQ4Rtt9WzV92qboUAQ7aG6SXrrWzXpvyRF8Qm"); // replace with your program id later

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = data;
        Ok(())
    }
}

#[account]
pub struct MyAccount {
    pub data: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

