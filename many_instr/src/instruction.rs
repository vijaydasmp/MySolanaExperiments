use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum CounterInstruction {
    Initialize,
    Increment,
    Decrement,
    Reset,
}
