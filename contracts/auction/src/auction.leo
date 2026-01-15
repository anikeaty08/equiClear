// EquiClear Auction Module
// Dutch auction with uniform clearing price

program equiclear_auction.aleo {
    // Auction record
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
        status: u8,
        clearing_price: u64,
    }
    
    // Public auction registry
    mapping auctions: field => bool;
    mapping auction_status: field => u8;
    mapping auction_supply: field => u64;
    mapping auction_clearing_price: field => u64;
    
    // Counter for auction IDs
    mapping auction_counter: u8 => u64;
    
    // Create a new Dutch auction
    transition create_auction(
        item_name: field,
        item_description: field,
        total_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64
    ) -> Auction {
        // Validate parameters
        assert(total_supply > 0u64);
        assert(start_price > reserve_price);
        assert(reserve_price > 0u64);
        assert(end_time > start_time);
        
        // Validate duration (1 hour to 7 days)
        let duration: u64 = end_time - start_time;
        assert(duration >= 3600u64);
        assert(duration <= 604800u64);
        
        // Generate auction ID from hash of parameters
        let auction_id: field = BHP256::hash_to_field(item_name);
        
        // Create auction record
        let auction: Auction = Auction {
            owner: self.caller,
            auction_id: auction_id,
            item_name: item_name,
            item_description: item_description,
            total_supply: total_supply,
            remaining_supply: total_supply,
            start_price: start_price,
            reserve_price: reserve_price,
            start_time: start_time,
            end_time: end_time,
            status: 0u8, // Created
            clearing_price: 0u64,
        };
        
        return auction then finalize(auction_id, total_supply);
    }
    
    finalize create_auction(auction_id: field, total_supply: u64) {
        // Register auction
        Mapping::set(auctions, auction_id, true);
        Mapping::set(auction_status, auction_id, 0u8);
        Mapping::set(auction_supply, auction_id, total_supply);
        
        // Increment counter
        let count: u64 = Mapping::get_or_use(auction_counter, 0u8, 0u64);
        Mapping::set(auction_counter, 0u8, count + 1u64);
    }
    
    // Activate auction (can only be called by owner after start_time)
    transition activate_auction(auction: Auction, current_time: u64) -> Auction {
        // Verify ownership
        assert_eq(auction.owner, self.caller);
        
        // Verify auction is in Created status
        assert_eq(auction.status, 0u8);
        
        // Verify we're past start time
        assert(current_time >= auction.start_time);
        
        // Create activated auction
        let activated: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            item_description: auction.item_description,
            total_supply: auction.total_supply,
            remaining_supply: auction.remaining_supply,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 1u8, // Active
            clearing_price: 0u64,
        };
        
        return activated then finalize(auction.auction_id);
    }
    
    finalize activate_auction(auction_id: field) {
        Mapping::set(auction_status, auction_id, 1u8);
    }
    
    // Get current Dutch auction price
    transition get_current_price(
        auction: Auction,
        current_time: u64
    ) -> u64 {
        // Verify auction is active
        assert_eq(auction.status, 1u8);
        
        // If before start, return start price
        if current_time <= auction.start_time {
            return auction.start_price;
        }
        
        // If after end, return reserve price
        if current_time >= auction.end_time {
            return auction.reserve_price;
        }
        
        // Calculate linear price decay
        let total_duration: u64 = auction.end_time - auction.start_time;
        let elapsed: u64 = current_time - auction.start_time;
        let price_drop: u64 = auction.start_price - auction.reserve_price;
        
        let decay: u64 = (elapsed * price_drop) / total_duration;
        let current_price: u64 = auction.start_price - decay;
        
        return current_price;
    }
    
    // Settle auction with uniform clearing price
    transition settle_auction(
        auction: Auction,
        clearing_price: u64,
        total_sold: u64,
        current_time: u64
    ) -> Auction {
        // Verify ownership
        assert_eq(auction.owner, self.caller);
        
        // Verify auction is active
        assert_eq(auction.status, 1u8);
        
        // Verify auction has ended
        assert(current_time >= auction.end_time);
        
        // Verify clearing price is within bounds
        assert(clearing_price >= auction.reserve_price);
        assert(clearing_price <= auction.start_price);
        
        // Verify sold amount doesn't exceed supply
        assert(total_sold <= auction.total_supply);
        
        // Create settled auction
        let settled: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            item_description: auction.item_description,
            total_supply: auction.total_supply,
            remaining_supply: auction.total_supply - total_sold,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 2u8, // Settled
            clearing_price: clearing_price,
        };
        
        return settled then finalize(auction.auction_id, clearing_price, auction.total_supply - total_sold);
    }
    
    finalize settle_auction(auction_id: field, clearing_price: u64, remaining: u64) {
        Mapping::set(auction_status, auction_id, 2u8);
        Mapping::set(auction_clearing_price, auction_id, clearing_price);
        Mapping::set(auction_supply, auction_id, remaining);
    }
    
    // Cancel auction (only by owner, before settlement)
    transition cancel_auction(auction: Auction) -> Auction {
        // Verify ownership
        assert_eq(auction.owner, self.caller);
        
        // Can only cancel if Created or Active (not Settled)
        assert(auction.status < 2u8);
        
        // Create cancelled auction
        let cancelled: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            item_description: auction.item_description,
            total_supply: auction.total_supply,
            remaining_supply: auction.total_supply,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 3u8, // Cancelled
            clearing_price: 0u64,
        };
        
        return cancelled then finalize(auction.auction_id);
    }
    
    finalize cancel_auction(auction_id: field) {
        Mapping::set(auction_status, auction_id, 3u8);
    }
}
