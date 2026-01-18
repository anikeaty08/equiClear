// EquiClear Balance Module
// Handles token deposits and withdrawals with privacy-preserving internal balances
// Uses credits.aleo for real Aleo testnet token transfers

import credits.aleo;

program equiclear_balance_v2.aleo {
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
    
    // Constructor - required for deployment (non-upgradable)
    @noupgrade
    async constructor() {}
    
    // Deposit real Aleo credits into private balance
    // recipient: explicit address that will own the records
    // credits: credits.aleo/credits record from user's wallet (must be transferred to program first)
    // This function consumes the credits record and creates a Balance record
    async transition deposit(
        recipient: address,
        credits: credits.aleo/credits,
        token_id: field,
        timestamp: u64
    ) -> (Balance, DepositReceipt, Future) {
        // Verify credits belong to recipient
        assert_eq(credits.owner, recipient);
        assert(credits.microcredits > 0u64);
        
        // Convert microcredits to credits (1 credit = 1,000,000 microcredits)
        // For simplicity, we'll use microcredits / 1000000 as the amount
        let amount: u64 = credits.microcredits / 1000000u64;
        assert(amount > 0u64);
        
        // Note: The credits record is consumed here (transferred to program)
        // In a real implementation, you'd transfer credits to program address first
        
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
    // balance: Balance record to withdraw from
    // withdraw_amount: amount to withdraw in credits
    // Note: User must call credits.aleo/transfer_public from program address to receive credits
    // This function only updates the balance - actual credits transfer happens separately
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
