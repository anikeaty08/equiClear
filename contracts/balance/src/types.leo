// EquiClear Balance Types

program equiclear_balance.aleo {
    // Private balance record - only visible to owner
    record Balance {
        owner: address,
        token_id: field,
        amount: u64,
    }
    
    // Deposit receipt for tracking
    record DepositReceipt {
        owner: address,
        token_id: field,
        amount: u64,
        timestamp: u64,
    }
    
    // Withdrawal receipt for tracking
    record WithdrawReceipt {
        owner: address,
        token_id: field,
        amount: u64,
        timestamp: u64,
    }
}
