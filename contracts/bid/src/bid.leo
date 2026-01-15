// EquiClear Bid Module
// Private bid submission and validation with ZK proofs

program equiclear_bid.aleo {
    // Private bid record
    record Bid {
        owner: address,
        auction_id: field,
        quantity: u64,
        max_price: u64,
        timestamp: u64,
        status: u8,
    }
    
    // Bid result after settlement
    record BidResult {
        owner: address,
        auction_id: field,
        quantity_won: u64,
        quantity_lost: u64,
        price_paid: u64,
        refund_amount: u64,
    }
    
    // Balance record (imported concept)
    record Balance {
        owner: address,
        token_id: field,
        amount: u64,
    }
    
    // Track bid count per auction (public)
    mapping bid_counts: field => u64;
    
    // Track total bid volume per auction (public aggregate only)
    mapping total_bid_volume: field => u64;
    
    // Place a private bid on an auction
    // Consumes balance and creates bid record
    transition place_bid(
        balance: Balance,
        auction_id: field,
        quantity: u64,
        max_price: u64,
        timestamp: u64
    ) -> (Bid, Balance) {
        // Verify ownership
        assert_eq(balance.owner, self.caller);
        
        // Calculate required amount
        let required_amount: u64 = quantity * max_price;
        
        // Ensure sufficient balance
        assert(balance.amount >= required_amount);
        assert(quantity > 0u64);
        assert(max_price > 0u64);
        
        // Calculate remaining balance
        let remaining: u64 = balance.amount - required_amount;
        
        // Create bid record (private)
        let bid: Bid = Bid {
            owner: self.caller,
            auction_id: auction_id,
            quantity: quantity,
            max_price: max_price,
            timestamp: timestamp,
            status: 0u8, // Pending
        };
        
        // Create remaining balance
        let new_balance: Balance = Balance {
            owner: self.caller,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        return (bid, new_balance) then finalize(auction_id, quantity);
    }
    
    finalize place_bid(auction_id: field, quantity: u64) {
        // Increment bid count
        let count: u64 = Mapping::get_or_use(bid_counts, auction_id, 0u64);
        Mapping::set(bid_counts, auction_id, count + 1u64);
        
        // Update total volume (doesn't reveal individual bid amounts)
        let volume: u64 = Mapping::get_or_use(total_bid_volume, auction_id, 0u64);
        Mapping::set(total_bid_volume, auction_id, volume + quantity);
    }
    
    // Update bid with higher max price (can only increase)
    transition increase_bid(
        bid: Bid,
        additional_balance: Balance,
        new_max_price: u64,
        timestamp: u64
    ) -> (Bid, Balance) {
        // Verify ownership
        assert_eq(bid.owner, self.caller);
        assert_eq(additional_balance.owner, self.caller);
        
        // Can only increase price
        assert(new_max_price > bid.max_price);
        
        // Bid must be pending
        assert_eq(bid.status, 0u8);
        
        // Calculate additional required amount
        let price_increase: u64 = new_max_price - bid.max_price;
        let additional_required: u64 = bid.quantity * price_increase;
        
        // Ensure sufficient additional balance
        assert(additional_balance.amount >= additional_required);
        
        // Create updated bid
        let updated_bid: Bid = Bid {
            owner: self.caller,
            auction_id: bid.auction_id,
            quantity: bid.quantity,
            max_price: new_max_price,
            timestamp: timestamp,
            status: 0u8,
        };
        
        // Calculate remaining balance
        let remaining: u64 = additional_balance.amount - additional_required;
        let new_balance: Balance = Balance {
            owner: self.caller,
            token_id: additional_balance.token_id,
            amount: remaining,
        };
        
        return (updated_bid, new_balance);
    }
    
    // Mark bid as won after settlement
    transition mark_bid_won(
        bid: Bid,
        clearing_price: u64,
        quantity_won: u64
    ) -> BidResult {
        // Verify ownership
        assert_eq(bid.owner, self.caller);
        
        // Bid must be pending
        assert_eq(bid.status, 0u8);
        
        // Bid must qualify (max_price >= clearing_price)
        assert(bid.max_price >= clearing_price);
        
        // Calculate amounts
        let price_paid: u64 = quantity_won * clearing_price;
        let original_locked: u64 = bid.quantity * bid.max_price;
        let refund_amount: u64 = original_locked - price_paid;
        let quantity_lost: u64 = bid.quantity - quantity_won;
        
        // Create bid result
        let result: BidResult = BidResult {
            owner: self.caller,
            auction_id: bid.auction_id,
            quantity_won: quantity_won,
            quantity_lost: quantity_lost,
            price_paid: price_paid,
            refund_amount: refund_amount,
        };
        
        return result;
    }
    
    // Mark bid as lost after settlement
    transition mark_bid_lost(bid: Bid) -> BidResult {
        // Verify ownership
        assert_eq(bid.owner, self.caller);
        
        // Bid must be pending
        assert_eq(bid.status, 0u8);
        
        // Full refund
        let refund_amount: u64 = bid.quantity * bid.max_price;
        
        // Create bid result
        let result: BidResult = BidResult {
            owner: self.caller,
            auction_id: bid.auction_id,
            quantity_won: 0u64,
            quantity_lost: bid.quantity,
            price_paid: 0u64,
            refund_amount: refund_amount,
        };
        
        return result;
    }
    
    // Cancel pending bid (returns locked balance)
    transition cancel_bid(bid: Bid) -> Balance {
        // Verify ownership
        assert_eq(bid.owner, self.caller);
        
        // Bid must be pending
        assert_eq(bid.status, 0u8);
        
        // Calculate refund
        let refund_amount: u64 = bid.quantity * bid.max_price;
        
        // Return balance
        let balance: Balance = Balance {
            owner: self.caller,
            token_id: 1field, // Default token
            amount: refund_amount,
        };
        
        return balance then finalize(bid.auction_id, bid.quantity);
    }
    
    finalize cancel_bid(auction_id: field, quantity: u64) {
        // Decrement bid count
        let count: u64 = Mapping::get_or_use(bid_counts, auction_id, 0u64);
        if count > 0u64 {
            Mapping::set(bid_counts, auction_id, count - 1u64);
        }
        
        // Update total volume
        let volume: u64 = Mapping::get_or_use(total_bid_volume, auction_id, 0u64);
        if volume >= quantity {
            Mapping::set(total_bid_volume, auction_id, volume - quantity);
        }
    }
}
