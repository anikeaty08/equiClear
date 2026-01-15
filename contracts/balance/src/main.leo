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
    
    // Initialize function - called at deployment
    async transition init() -> Future {
        let f: Future = finalize_init();
        return f;
    }
    
    async function finalize_init() {
        // Initialize with empty state
        Mapping::set(total_deposits, 0field, 0u64);
    }
    
    // Deposit tokens into private balance
    // recipient: explicit address that will own the records (avoids self.caller warning)
    async transition deposit(
        recipient: address,
        token_id: field,
        amount: u64,
        timestamp: u64
    ) -> (Balance, DepositReceipt, Future) {
        assert(amount > 0u64);
        
        let balance: Balance = Balance {
            owner: recipient,
            token_id: token_id,
            amount: amount,
        };
        
        let receipt: DepositReceipt = DepositReceipt {
            owner: recipient,
            token_id: token_id,
            amount: amount,
            timestamp: timestamp,
        };
        
        let f: Future = finalize_deposit(token_id, amount);
        return (balance, receipt, f);
    }
    
    async function finalize_deposit(token_id: field, amount: u64) {
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current + amount);
    }
    
    // Withdraw tokens from private balance back to wallet
    // recipient: explicit address that will own the new records
    async transition withdraw(
        recipient: address,
        balance: Balance,
        withdraw_amount: u64,
        timestamp: u64
    ) -> (Balance, WithdrawReceipt, Future) {
        assert_eq(balance.owner, recipient);
        assert(balance.amount >= withdraw_amount);
        assert(withdraw_amount > 0u64);
        
        let remaining: u64 = balance.amount - withdraw_amount;
        
        let new_balance: Balance = Balance {
            owner: recipient,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        let receipt: WithdrawReceipt = WithdrawReceipt {
            owner: recipient,
            token_id: balance.token_id,
            amount: withdraw_amount,
            timestamp: timestamp,
        };
        
        let f: Future = finalize_withdraw(balance.token_id, withdraw_amount);
        return (new_balance, receipt, f);
    }
    
    async function finalize_withdraw(token_id: field, amount: u64) {
        let current: u64 = Mapping::get_or_use(total_deposits, token_id, 0u64);
        Mapping::set(total_deposits, token_id, current - amount);
    }
    
    // Merge two balance records
    // recipient: explicit address that will own the merged record
    transition merge_balances(
        recipient: address,
        balance1: Balance,
        balance2: Balance
    ) -> Balance {
        assert_eq(balance1.owner, recipient);
        assert_eq(balance2.owner, recipient);
        assert_eq(balance1.token_id, balance2.token_id);
        
        let merged: Balance = Balance {
            owner: recipient,
            token_id: balance1.token_id,
            amount: balance1.amount + balance2.amount,
        };
        
        return merged;
    }
    
    // Split a balance into two parts
    // recipient: explicit address that will own both split records
    transition split_balance(
        recipient: address,
        balance: Balance,
        split_amount: u64
    ) -> (Balance, Balance) {
        assert_eq(balance.owner, recipient);
        assert(split_amount > 0u64);
        assert(split_amount < balance.amount);
        
        let remaining: u64 = balance.amount - split_amount;
        
        let balance1: Balance = Balance {
            owner: recipient,
            token_id: balance.token_id,
            amount: split_amount,
        };
        
        let balance2: Balance = Balance {
            owner: recipient,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        return (balance1, balance2);
    }
}
