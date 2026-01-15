// EquiClear Bid Types

program equiclear_bid.aleo {
    // Private bid record - only visible to bidder
    record Bid {
        owner: address,
        auction_id: field,
        quantity: u64,
        max_price: u64,
        timestamp: u64,
        status: u8, // 0:Pending, 1:Won, 2:Lost, 3:Refunded
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
}
