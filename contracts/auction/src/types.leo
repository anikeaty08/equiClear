// EquiClear Auction Types

program equiclear_auction.aleo {
    // Auction record - represents a Dutch auction
    record Auction {
        owner: address,
        auction_id: field,
        item_name: field,
        item_description: field,
        total_supply: u64,
        remaining_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
        status: u8, // 0:Created, 1:Active, 2:Settled, 3:Cancelled
        clearing_price: u64,
    }
    
    // Public auction info (non-sensitive data)
    struct AuctionInfo {
        auction_id: field,
        creator: address,
        item_name: field,
        total_supply: u64,
        remaining_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
        status: u8,
    }
    
    // Settlement result
    struct SettlementResult {
        auction_id: field,
        clearing_price: u64,
        total_sold: u64,
        total_revenue: u64,
    }
}
