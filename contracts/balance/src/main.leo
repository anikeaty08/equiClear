// EquiClear Balance Module
// Handles token deposits and withdrawals with privacy-preserving internal balances

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
    
    // Mapping to track total deposited (public aggregate only)
    mapping total_deposits: field => u64;
    
    // Deposit tokens into private balance
    transition deposit(
        token_id: field,
        amount: u64,
        timestamp: u64
    ) -> (Balance, DepositReceipt) {
        assert(amount > 0u64);
        
        let balance: Balance = Balance {
            owner: self.caller,
            token_id: token_id,
            amount: amount,
        };
        
        let receipt: DepositReceipt = DepositReceipt {
            owner: self.caller,
            token_id: token_id,
            amount: amount,
            timestamp: timestamp,
        };
        
        return (balance, receipt) then finalize(token_id, amount);
    }
    
    finalize deposit(token_id: field, amount: u64) {
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current + amount);
    }
    
    // Withdraw tokens from private balance back to wallet
    transition withdraw(
        balance: Balance,
        withdraw_amount: u64,
        timestamp: u64
    ) -> (Balance, WithdrawReceipt) {
        assert_eq(balance.owner, self.caller);
        assert(balance.amount >= withdraw_amount);
        assert(withdraw_amount > 0u64);
        
        let remaining: u64 = balance.amount - withdraw_amount;
        
        let new_balance: Balance = Balance {
            owner: self.caller,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        let receipt: WithdrawReceipt = WithdrawReceipt {
            owner: self.caller,
            token_id: balance.token_id,
            amount: withdraw_amount,
            timestamp: timestamp,
        };
        
        return (new_balance, receipt) then finalize(balance.token_id, withdraw_amount);
    }
    
    finalize withdraw(token_id: field, amount: u64) {
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current - amount);
    }
    
    // Merge two balance records
    transition merge_balances(
        balance1: Balance,
        balance2: Balance
    ) -> Balance {
        assert_eq(balance1.owner, self.caller);
        assert_eq(balance2.owner, self.caller);
        assert_eq(balance1.token_id, balance2.token_id);
        
        let merged: Balance = Balance {
            owner: self.caller,
            token_id: balance1.token_id,
            amount: balance1.amount + balance2.amount,
        };
        
        return merged;
    }
    
    // Split a balance into two parts
    transition split_balance(
        balance: Balance,
        split_amount: u64
    ) -> (Balance, Balance) {
        assert_eq(balance.owner, self.caller);
        assert(split_amount > 0u64);
        assert(split_amount < balance.amount);
        
        let remaining: u64 = balance.amount - split_amount;
        
        let balance1: Balance = Balance {
            owner: self.caller,
            token_id: balance.token_id,
            amount: split_amount,
        };
        
        let balance2: Balance = Balance {
            owner: self.caller,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        return (balance1, balance2);
    }
}
