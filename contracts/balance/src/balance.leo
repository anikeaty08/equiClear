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
    // Creates a new Balance record owned by the caller
    transition deposit(
        token_id: field,
        amount: u64,
        timestamp: u64
    ) -> (Balance, DepositReceipt) {
        // Ensure positive amount
        assert(amount > 0u64);
        
        // Create private balance record
        let balance: Balance = Balance {
            owner: self.caller,
            token_id: token_id,
            amount: amount,
        };
        
        // Create deposit receipt
        let receipt: DepositReceipt = DepositReceipt {
            owner: self.caller,
            token_id: token_id,
            amount: amount,
            timestamp: timestamp,
        };
        
        return (balance, receipt) then finalize(token_id, amount);
    }
    
    finalize deposit(token_id: field, amount: u64) {
        // Update total deposits (public aggregate)
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current + amount);
    }
    
    // Withdraw tokens from private balance back to wallet
    transition withdraw(
        balance: Balance,
        withdraw_amount: u64,
        timestamp: u64
    ) -> (Balance, WithdrawReceipt) {
        // Ensure caller owns the balance
        assert_eq(balance.owner, self.caller);
        
        // Ensure sufficient balance
        assert(balance.amount >= withdraw_amount);
        assert(withdraw_amount > 0u64);
        
        // Calculate remaining balance
        let remaining: u64 = balance.amount - withdraw_amount;
        
        // Create new balance with remaining amount
        let new_balance: Balance = Balance {
            owner: self.caller,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        // Create withdrawal receipt
        let receipt: WithdrawReceipt = WithdrawReceipt {
            owner: self.caller,
            token_id: balance.token_id,
            amount: withdraw_amount,
            timestamp: timestamp,
        };
        
        return (new_balance, receipt) then finalize(balance.token_id, withdraw_amount);
    }
    
    finalize withdraw(token_id: field, amount: u64) {
        // Update total deposits (public aggregate)
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current - amount);
    }
    
    // Merge two balance records (same owner, same token)
    transition merge_balances(
        balance1: Balance,
        balance2: Balance
    ) -> Balance {
        // Ensure caller owns both balances
        assert_eq(balance1.owner, self.caller);
        assert_eq(balance2.owner, self.caller);
        
        // Ensure same token
        assert_eq(balance1.token_id, balance2.token_id);
        
        // Create merged balance
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
        // Ensure caller owns the balance
        assert_eq(balance.owner, self.caller);
        
        // Ensure valid split amount
        assert(split_amount > 0u64);
        assert(split_amount < balance.amount);
        
        let remaining: u64 = balance.amount - split_amount;
        
        // Create two new balances
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
