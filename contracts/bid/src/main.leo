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
    
    // Settlement record after auction ends
    record Settlement {
        owner: address,
        auction_id: field,
        quantity_won: u64,
        quantity_lost: u64,
        price_paid: u64,
        refund_amount: u64,
    }
    
    // Balance record
    record Balance {
        owner: address,
        token_id: field,
        amount: u64,
    }
    
    // Track bid count per auction
    mapping bid_counts: field => u64;
    mapping total_bid_volume: field => u64;
    
    // Constructor - required for deployment (non-upgradable)
    @noupgrade
    async constructor() {}
    
    // Place a private bid on an auction
    // bidder: explicit address that will own the bid and balance records
    async transition place_bid(
        bidder: address,
        balance: Balance,
        auction_id: field,
        quantity: u64,
        max_price: u64,
        timestamp: u64
    ) -> (Bid, Balance, Future) {
        assert_eq(balance.owner, bidder);
        
        let required_amount: u64 = quantity * max_price;
        assert(balance.amount >= required_amount);
        assert(quantity > 0u64);
        assert(max_price > 0u64);
        
        let remaining: u64 = balance.amount - required_amount;
        
        let bid: Bid = Bid {
            owner: bidder,
            auction_id: auction_id,
            quantity: quantity,
            max_price: max_price,
            timestamp: timestamp,
            status: 0u8,
        };
        
        let new_balance: Balance = Balance {
            owner: bidder,
            token_id: balance.token_id,
            amount: remaining,
        };
        
        let f: Future = finalize_place_bid(auction_id, quantity);
        return (bid, new_balance, f);
    }
    
    async function finalize_place_bid(auction_id: field, quantity: u64) {
        let count: u64 = Mapping::get_or_use(bid_counts, auction_id, 0u64);
        Mapping::set(bid_counts, auction_id, count + 1u64);
        
        let volume: u64 = Mapping::get_or_use(total_bid_volume, auction_id, 0u64);
        Mapping::set(total_bid_volume, auction_id, volume + quantity);
    }
    
    // Mark bid as won after settlement
    // winner: explicit address that will own the settlement record
    transition mark_bid_won(
        winner: address,
        bid: Bid,
        clearing_price: u64,
        quantity_won: u64
    ) -> Settlement {
        assert_eq(bid.owner, winner);
        assert_eq(bid.status, 0u8);
        assert(bid.max_price >= clearing_price);
        
        let price_paid: u64 = quantity_won * clearing_price;
        let original_locked: u64 = bid.quantity * bid.max_price;
        let refund_amount: u64 = original_locked - price_paid;
        let quantity_lost: u64 = bid.quantity - quantity_won;
        
        let result: Settlement = Settlement {
            owner: winner,
            auction_id: bid.auction_id,
            quantity_won: quantity_won,
            quantity_lost: quantity_lost,
            price_paid: price_paid,
            refund_amount: refund_amount,
        };
        
        return result;
    }
    
    // Mark bid as lost after settlement
    // loser: explicit address that will own the settlement record
    transition mark_bid_lost(loser: address, bid: Bid) -> Settlement {
        assert_eq(bid.owner, loser);
        assert_eq(bid.status, 0u8);
        
        let refund_amount: u64 = bid.quantity * bid.max_price;
        
        let result: Settlement = Settlement {
            owner: loser,
            auction_id: bid.auction_id,
            quantity_won: 0u64,
            quantity_lost: bid.quantity,
            price_paid: 0u64,
            refund_amount: refund_amount,
        };
        
        return result;
    }
    
    // Cancel pending bid
    // bidder: explicit address that will own the refund balance
    async transition cancel_bid(bidder: address, bid: Bid) -> (Balance, Future) {
        assert_eq(bid.owner, bidder);
        assert_eq(bid.status, 0u8);
        
        let refund_amount: u64 = bid.quantity * bid.max_price;
        
        let balance: Balance = Balance {
            owner: bidder,
            token_id: 1field,
            amount: refund_amount,
        };
        
        let f: Future = finalize_cancel_bid(bid.auction_id, bid.quantity);
        return (balance, f);
    }
    
    async function finalize_cancel_bid(auction_id: field, quantity: u64) {
        let count: u64 = Mapping::get_or_use(bid_counts, auction_id, 0u64);
        if count > 0u64 {
            Mapping::set(bid_counts, auction_id, count - 1u64);
        }
        
        let volume: u64 = Mapping::get_or_use(total_bid_volume, auction_id, 0u64);
        if volume >= quantity {
            Mapping::set(total_bid_volume, auction_id, volume - quantity);
        }
    }
}
