// EquiClear Shared Utility Functions

program equiclear_utils.aleo {
    // Calculate Dutch auction price at a given time
    // Price decreases linearly from start_price to reserve_price
    transition calculate_price(
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
        current_time: u64
    ) -> u64 {
        // If auction hasn't started, return start price
        if current_time <= start_time {
            return start_price;
        }
        
        // If auction has ended, return reserve price
        if current_time >= end_time {
            return reserve_price;
        }
        
        // Calculate linear price decay
        let total_duration: u64 = end_time - start_time;
        let elapsed: u64 = current_time - start_time;
        let price_drop: u64 = start_price - reserve_price;
        
        // Price = start_price - (elapsed / total_duration) * price_drop
        let decay: u64 = (elapsed * price_drop) / total_duration;
        let current_price: u64 = start_price - decay;
        
        return current_price;
    }
    
    // Calculate platform fee from amount
    transition calculate_fee(amount: u64, fee_bps: u64) -> u64 {
        return (amount * fee_bps) / 10000u64;
    }
    
    // Validate auction parameters
    transition validate_auction_params(
        start_price: u64,
        reserve_price: u64,
        start_time: u64,
        end_time: u64,
        total_supply: u64
    ) -> bool {
        // Start price must be greater than reserve price
        assert(start_price > reserve_price);
        
        // End time must be after start time
        assert(end_time > start_time);
        
        // Duration must be within bounds
        let duration: u64 = end_time - start_time;
        assert(duration >= 3600u64); // Min 1 hour
        assert(duration <= 604800u64); // Max 7 days
        
        // Supply must be positive
        assert(total_supply > 0u64);
        
        // Prices must be positive
        assert(start_price > 0u64);
        assert(reserve_price > 0u64);
        
        return true;
    }
}
