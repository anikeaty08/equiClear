//! EquiClear Indexer - Event Types and Parsing

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Auction status enum matching Leo contract
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuctionStatus {
    Created = 0,
    Active = 1,
    Settled = 2,
    Cancelled = 3,
}

impl From<u8> for AuctionStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => AuctionStatus::Created,
            1 => AuctionStatus::Active,
            2 => AuctionStatus::Settled,
            3 => AuctionStatus::Cancelled,
            _ => AuctionStatus::Created,
        }
    }
}

/// Bid status enum matching Leo contract
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BidStatus {
    Pending = 0,
    Won = 1,
    Lost = 2,
    Refunded = 3,
}

impl From<u8> for BidStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => BidStatus::Pending,
            1 => BidStatus::Won,
            2 => BidStatus::Lost,
            3 => BidStatus::Refunded,
            _ => BidStatus::Pending,
        }
    }
}

/// Auction event from blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionEvent {
    pub event_type: String,
    pub auction_id: String,
    pub creator: String,
    pub item_name: String,
    pub total_supply: u64,
    pub start_price: u64,
    pub reserve_price: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub status: AuctionStatus,
    pub block_height: u64,
    pub timestamp: DateTime<Utc>,
}

/// Bid event from blockchain (public aggregate only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BidEvent {
    pub event_type: String,
    pub auction_id: String,
    pub bid_count: u64,
    pub total_volume: u64,
    pub block_height: u64,
    pub timestamp: DateTime<Utc>,
}

/// Settlement event from blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementEvent {
    pub auction_id: String,
    pub clearing_price: u64,
    pub total_sold: u64,
    pub total_revenue: u64,
    pub block_height: u64,
    pub timestamp: DateTime<Utc>,
}

/// Claim event from blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaimEvent {
    pub event_type: String,
    pub auction_id: String,
    pub claimer: String,
    pub items_claimed: u64,
    pub refund_amount: u64,
    pub block_height: u64,
    pub timestamp: DateTime<Utc>,
}

/// Generic blockchain event wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum BlockchainEvent {
    Auction(AuctionEvent),
    Bid(BidEvent),
    Settlement(SettlementEvent),
    Claim(ClaimEvent),
}

/// Parse raw blockchain data into events
pub fn parse_transaction_events(_tx_data: &str) -> Vec<BlockchainEvent> {
    // In production, this would parse actual Aleo transaction outputs
    // For now, return empty vec - events come from Supabase subscriptions
    Vec::new()
}
