// EquiClear Auction Module
// Dutch auction with uniform clearing price

program equiclear_auction.aleo {
    // Auction record
    record Auction {
        owner: address,
        auction_id: field,
        item_name: field,
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
    mapping auction_counter: u8 => u64;
    
    // Initialize function - called at deployment
    async transition init() -> Future {
        let f: Future = finalize_init();
        return f;
    }
    
    async function finalize_init() {
        // Initialize auction counter
        Mapping::set(auction_counter, 0u8, 0u64);
    }
    
    // Create a new Dutch auction
    // auction_owner: explicit address that will own the auction record
    async transition create_auction(
        auction_owner: address,
        item_name: field,
        total_supply: u64,
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64
    ) -> (Auction, Future) {
        assert(total_supply > 0u64);
        assert(start_price > reserve_price);
        assert(reserve_price > 0u64);
        assert(end_time > start_time);
        
        let duration: u64 = end_time - start_time;
        assert(duration >= 3600u64);
        assert(duration <= 604800u64);
        
        let auction_id: field = BHP256::hash_to_field(item_name);
        
        let auction: Auction = Auction {
            owner: auction_owner,
            auction_id: auction_id,
            item_name: item_name,
            total_supply: total_supply,
            remaining_supply: total_supply,
            start_price: start_price,
            reserve_price: reserve_price,
            start_time: start_time,
            end_time: end_time,
            status: 0u8,
            clearing_price: 0u64,
        };
        
        let f: Future = finalize_create_auction(auction_id, total_supply);
        return (auction, f);
    }
    
    async function finalize_create_auction(auction_id: field, total_supply: u64) {
        Mapping::set(auctions, auction_id, true);
        Mapping::set(auction_status, auction_id, 0u8);
        Mapping::set(auction_supply, auction_id, total_supply);
        
        let count: u64 = Mapping::get_or_use(auction_counter, 0u8, 0u64);
        Mapping::set(auction_counter, 0u8, count + 1u64);
    }
    
    // Activate auction
    async transition activate_auction(auction: Auction, current_time: u64) -> (Auction, Future) {
        assert_eq(auction.status, 0u8);
        assert(current_time >= auction.start_time);
        
        let activated: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            total_supply: auction.total_supply,
            remaining_supply: auction.remaining_supply,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 1u8,
            clearing_price: 0u64,
        };
        
        let f: Future = finalize_activate_auction(auction.auction_id);
        return (activated, f);
    }
    
    async function finalize_activate_auction(auction_id: field) {
        Mapping::set(auction_status, auction_id, 1u8);
    }
    
    // Settle auction with uniform clearing price
    async transition settle_auction(
        auction: Auction,
        clearing_price: u64,
        total_sold: u64,
        current_time: u64
    ) -> (Auction, Future) {
        assert_eq(auction.status, 1u8);
        assert(current_time >= auction.end_time);
        assert(clearing_price >= auction.reserve_price);
        assert(clearing_price <= auction.start_price);
        assert(total_sold <= auction.total_supply);
        
        let settled: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            total_supply: auction.total_supply,
            remaining_supply: auction.total_supply - total_sold,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 2u8,
            clearing_price: clearing_price,
        };
        
        let f: Future = finalize_settle_auction(auction.auction_id, clearing_price, auction.total_supply - total_sold);
        return (settled, f);
    }
    
    async function finalize_settle_auction(auction_id: field, clearing_price: u64, remaining: u64) {
        Mapping::set(auction_status, auction_id, 2u8);
        Mapping::set(auction_clearing_price, auction_id, clearing_price);
        Mapping::set(auction_supply, auction_id, remaining);
    }
    
    // Cancel auction
    async transition cancel_auction(auction: Auction) -> (Auction, Future) {
        assert(auction.status < 2u8);
        
        let cancelled: Auction = Auction {
            owner: auction.owner,
            auction_id: auction.auction_id,
            item_name: auction.item_name,
            total_supply: auction.total_supply,
            remaining_supply: auction.total_supply,
            start_price: auction.start_price,
            reserve_price: auction.reserve_price,
            start_time: auction.start_time,
            end_time: auction.end_time,
            status: 3u8,
            clearing_price: 0u64,
        };
        
        let f: Future = finalize_cancel_auction(auction.auction_id);
        return (cancelled, f);
    }
    
    async function finalize_cancel_auction(auction_id: field) {
        Mapping::set(auction_status, auction_id, 3u8);
    }
}
