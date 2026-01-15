//! EquiClear Indexer - REST API Service

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use chrono::{DateTime, Utc};

use crate::state::{SupabaseClient, AuctionRecord, BidAggregate, ClaimRecord};
use crate::events::AuctionStatus;

/// Application state
pub struct AppState {
    pub supabase: SupabaseClient,
}

/// API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
    
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}

/// Query parameters for auction list
#[derive(Debug, Deserialize)]
pub struct AuctionQuery {
    pub status: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// Current price response
#[derive(Debug, Serialize)]
pub struct CurrentPriceResponse {
    pub auction_id: String,
    pub current_price: u64,
    pub time_remaining: i64,
    pub progress_percent: f64,
}

/// Auction stats response
#[derive(Debug, Serialize)]
pub struct AuctionStatsResponse {
    pub total_auctions: i64,
    pub active_auctions: i64,
    pub total_volume: i64,
    pub total_bids: i64,
}

/// Create the API router
pub fn create_router(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    
    Router::new()
        // Auction endpoints
        .route("/api/auctions", get(get_auctions))
        .route("/api/auctions/:id", get(get_auction))
        .route("/api/auctions/:id/price", get(get_current_price))
        .route("/api/auctions/:id/bids", get(get_bid_aggregate))
        
        // User endpoints
        .route("/api/user/:address/claims", get(get_user_claims))
        
        // Stats endpoint
        .route("/api/stats", get(get_stats))
        
        // Health check
        .route("/health", get(health_check))
        
        .layer(cors)
        .with_state(state)
}

/// Health check endpoint
async fn health_check() -> &'static str {
    "OK"
}

/// Get all auctions with optional filters
async fn get_auctions(
    State(state): State<Arc<AppState>>,
    Query(params): Query<AuctionQuery>,
) -> Result<Json<ApiResponse<Vec<AuctionRecord>>>, StatusCode> {
    let status = params.status.map(|s| match s.as_str() {
        "created" => AuctionStatus::Created,
        "active" => AuctionStatus::Active,
        "settled" => AuctionStatus::Settled,
        "cancelled" => AuctionStatus::Cancelled,
        _ => AuctionStatus::Active,
    });
    
    match state.supabase.get_auctions(status).await {
        Ok(auctions) => Ok(Json(ApiResponse::success(auctions))),
        Err(e) => {
            tracing::error!("Failed to get auctions: {}", e);
            Ok(Json(ApiResponse::error("Failed to fetch auctions")))
        }
    }
}

/// Get single auction by ID
async fn get_auction(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<AuctionRecord>>, StatusCode> {
    match state.supabase.get_auction(&id).await {
        Ok(Some(auction)) => Ok(Json(ApiResponse::success(auction))),
        Ok(None) => Ok(Json(ApiResponse::error("Auction not found"))),
        Err(e) => {
            tracing::error!("Failed to get auction: {}", e);
            Ok(Json(ApiResponse::error("Failed to fetch auction")))
        }
    }
}

/// Calculate and return current Dutch auction price
async fn get_current_price(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<CurrentPriceResponse>>, StatusCode> {
    match state.supabase.get_auction(&id).await {
        Ok(Some(auction)) => {
            let now = Utc::now();
            let start = auction.start_time;
            let end = auction.end_time;
            
            // Calculate current price using Dutch auction formula
            let current_price = if now <= start {
                auction.start_price as u64
            } else if now >= end {
                auction.reserve_price as u64
            } else {
                let total_duration = (end - start).num_seconds() as f64;
                let elapsed = (now - start).num_seconds() as f64;
                let price_drop = (auction.start_price - auction.reserve_price) as f64;
                let decay = (elapsed / total_duration) * price_drop;
                (auction.start_price as f64 - decay) as u64
            };
            
            let time_remaining = (end - now).num_seconds().max(0);
            let total_duration = (end - start).num_seconds() as f64;
            let elapsed = (now - start).num_seconds() as f64;
            let progress_percent = ((elapsed / total_duration) * 100.0).min(100.0).max(0.0);
            
            let response = CurrentPriceResponse {
                auction_id: id,
                current_price,
                time_remaining,
                progress_percent,
            };
            
            Ok(Json(ApiResponse::success(response)))
        }
        Ok(None) => Ok(Json(ApiResponse::error("Auction not found"))),
        Err(e) => {
            tracing::error!("Failed to get auction price: {}", e);
            Ok(Json(ApiResponse::error("Failed to fetch price")))
        }
    }
}

/// Get bid aggregate for auction
async fn get_bid_aggregate(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<BidAggregate>>, StatusCode> {
    match state.supabase.get_bid_aggregate(&id).await {
        Ok(Some(aggregate)) => Ok(Json(ApiResponse::success(aggregate))),
        Ok(None) => {
            // Return empty aggregate if none exists
            let empty = BidAggregate {
                auction_id: id,
                bid_count: 0,
                total_volume: 0,
                updated_at: Utc::now(),
            };
            Ok(Json(ApiResponse::success(empty)))
        }
        Err(e) => {
            tracing::error!("Failed to get bid aggregate: {}", e);
            Ok(Json(ApiResponse::error("Failed to fetch bid data")))
        }
    }
}

/// Get claims for a user
async fn get_user_claims(
    State(state): State<Arc<AppState>>,
    Path(address): Path<String>,
) -> Result<Json<ApiResponse<Vec<ClaimRecord>>>, StatusCode> {
    match state.supabase.get_user_claims(&address).await {
        Ok(claims) => Ok(Json(ApiResponse::success(claims))),
        Err(e) => {
            tracing::error!("Failed to get user claims: {}", e);
            Ok(Json(ApiResponse::error("Failed to fetch claims")))
        }
    }
}

/// Get platform stats
async fn get_stats(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<AuctionStatsResponse>>, StatusCode> {
    // In production, these would be aggregated from Supabase
    let stats = AuctionStatsResponse {
        total_auctions: 0,
        active_auctions: 0,
        total_volume: 0,
        total_bids: 0,
    };
    
    Ok(Json(ApiResponse::success(stats)))
}

/// Start the API server
pub async fn start_server(state: Arc<AppState>, port: u16) -> Result<(), anyhow::Error> {
    let router = create_router(state);
    
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("🚀 Indexer API running on port {}", port);
    
    axum::serve(listener, router).await?;
    
    Ok(())
}
