//! EquiClear Indexer - State Management with Supabase

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::events::AuctionStatus;

/// Supabase client wrapper
pub struct SupabaseClient {
    client: postgrest::Postgrest,
    url: String,
}

impl SupabaseClient {
    pub fn new(url: &str, api_key: &str) -> Self {
        let client = postgrest::Postgrest::new(format!("{}/rest/v1", url))
            .insert_header("apikey", api_key)
            .insert_header("Authorization", format!("Bearer {}", api_key));
        
        Self {
            client,
            url: url.to_string(),
        }
    }
    
    /// Insert a new auction
    pub async fn insert_auction(&self, auction: &AuctionRecord) -> Result<(), anyhow::Error> {
        self.client
            .from("auctions")
            .insert(serde_json::to_string(&[auction])?)
            .execute()
            .await?;
        Ok(())
    }
    
    /// Update auction status
    pub async fn update_auction_status(
        &self,
        auction_id: &str,
        status: AuctionStatus,
    ) -> Result<(), anyhow::Error> {
        self.client
            .from("auctions")
            .eq("auction_id", auction_id)
            .update(format!(r#"{{"status": "{}"}}"#, status as u8))
            .execute()
            .await?;
        Ok(())
    }
    
    /// Get all auctions
    pub async fn get_auctions(&self, status: Option<AuctionStatus>) -> Result<Vec<AuctionRecord>, anyhow::Error> {
        let mut query = self.client.from("auctions").select("*");
        
        if let Some(s) = status {
            query = query.eq("status", (s as u8).to_string());
        }
        
        let response = query.execute().await?;
        let auctions: Vec<AuctionRecord> = response.json().await?;
        Ok(auctions)
    }
    
    /// Get auction by ID
    pub async fn get_auction(&self, auction_id: &str) -> Result<Option<AuctionRecord>, anyhow::Error> {
        let response = self.client
            .from("auctions")
            .eq("auction_id", auction_id)
            .select("*")
            .single()
            .execute()
            .await?;
        
        let auction: Option<AuctionRecord> = response.json().await.ok();
        Ok(auction)
    }
    
    /// Update auction with settlement data
    pub async fn settle_auction(
        &self,
        auction_id: &str,
        clearing_price: u64,
        total_sold: u64,
    ) -> Result<(), anyhow::Error> {
        self.client
            .from("auctions")
            .eq("auction_id", auction_id)
            .update(format!(
                r#"{{"status": 2, "clearing_price": {}, "remaining_supply": {}}}"#,
                clearing_price,
                total_sold
            ))
            .execute()
            .await?;
        Ok(())
    }
    
    /// Insert bid aggregate (not individual bids - those are private)
    pub async fn update_bid_aggregate(&self, aggregate: &BidAggregate) -> Result<(), anyhow::Error> {
        self.client
            .from("bid_aggregates")
            .upsert(serde_json::to_string(&[aggregate])?)
            .execute()
            .await?;
        Ok(())
    }
    
    /// Get bid aggregate for auction
    pub async fn get_bid_aggregate(&self, auction_id: &str) -> Result<Option<BidAggregate>, anyhow::Error> {
        let response = self.client
            .from("bid_aggregates")
            .eq("auction_id", auction_id)
            .select("*")
            .single()
            .execute()
            .await?;
        
        let aggregate: Option<BidAggregate> = response.json().await.ok();
        Ok(aggregate)
    }
    
    /// Insert claim record
    pub async fn insert_claim(&self, claim: &ClaimRecord) -> Result<(), anyhow::Error> {
        self.client
            .from("claims")
            .insert(serde_json::to_string(&[claim])?)
            .execute()
            .await?;
        Ok(())
    }
    
    /// Get claims for user
    pub async fn get_user_claims(&self, user_address: &str) -> Result<Vec<ClaimRecord>, anyhow::Error> {
        let response = self.client
            .from("claims")
            .eq("user_address", user_address)
            .select("*")
            .execute()
            .await?;
        
        let claims: Vec<ClaimRecord> = response.json().await?;
        Ok(claims)
    }
}

/// Auction record for Supabase
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionRecord {
    pub id: Option<String>,
    pub auction_id: String,
    pub creator: String,
    pub item_name: String,
    pub item_description: Option<String>,
    pub total_supply: i64,
    pub remaining_supply: i64,
    pub start_price: i64,
    pub reserve_price: i64,
    pub clearing_price: Option<i64>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub status: i32,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// Bid aggregate (public data only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BidAggregate {
    pub auction_id: String,
    pub bid_count: i64,
    pub total_volume: i64,
    pub updated_at: DateTime<Utc>,
}

/// Claim record for Supabase
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaimRecord {
    pub id: Option<String>,
    pub auction_id: String,
    pub user_address: String,
    pub items_claimed: i64,
    pub amount_paid: i64,
    pub refund_amount: i64,
    pub claimed_at: DateTime<Utc>,
}

/// Price history for charts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricePoint {
    pub auction_id: String,
    pub price: i64,
    pub timestamp: DateTime<Utc>,
}
