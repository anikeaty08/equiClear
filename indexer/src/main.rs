//! EquiClear Indexer - Main Entry Point

mod events;
mod state;
mod service;

use std::sync::Arc;
use dotenv::dotenv;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use state::SupabaseClient;
use service::{AppState, start_server};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    tracing::info!("🏁 Starting EquiClear Indexer...");
    
    // Get configuration from environment
    let supabase_url = std::env::var("SUPABASE_URL")
        .expect("SUPABASE_URL must be set");
    let supabase_key = std::env::var("SUPABASE_SERVICE_KEY")
        .expect("SUPABASE_SERVICE_KEY must be set");
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .expect("Invalid PORT");
    
    // Initialize Supabase client
    // Log Supabase URL (masked) for debugging
    if supabase_url.len() > 10 {
        let masked_url = format!("{}...", &supabase_url[..10]);
        tracing::info!("🔗 Connecting to Supabase: {}", masked_url);
    } else {
        tracing::warn!("⚠️ Supabase URL seems too short!");
    }

    let supabase = SupabaseClient::new(&supabase_url, &supabase_key);
    tracing::info!("✅ Connected to Supabase");
    
    // Create application state
    let state = Arc::new(AppState { supabase });
    
    // Start API server
    // Trigger deployment
    start_server(state, port).await?;
    
    Ok(())
}
