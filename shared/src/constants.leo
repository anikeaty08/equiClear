// EquiClear Shared Constants
// Used across all auction contracts

program equiclear_shared.aleo {
    // Default token ID for EquiClear platform payments
    const DEFAULT_TOKEN_ID: field = 1field;
    
    // Auction status codes
    const STATUS_CREATED: u8 = 0u8;
    const STATUS_ACTIVE: u8 = 1u8;
    const STATUS_SETTLED: u8 = 2u8;
    const STATUS_CANCELLED: u8 = 3u8;
    
    // Bid status codes
    const BID_PENDING: u8 = 0u8;
    const BID_WON: u8 = 1u8;
    const BID_LOST: u8 = 2u8;
    const BID_REFUNDED: u8 = 3u8;
    
    // Auction constraints
    const MIN_AUCTION_DURATION: u64 = 3600u64; // 1 hour in seconds
    const MAX_AUCTION_DURATION: u64 = 604800u64; // 7 days in seconds
    const MIN_PRICE: u64 = 1u64;
    const MAX_PRICE: u64 = 1000000000u64; // 1 billion units
    
    // Fee configuration (basis points, 100 = 1%)
    const PLATFORM_FEE_BPS: u64 = 250u64; // 2.5% platform fee
}
