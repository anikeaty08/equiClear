-- EquiClear Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id TEXT UNIQUE NOT NULL,
    creator TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_description TEXT,
    total_supply BIGINT NOT NULL,
    remaining_supply BIGINT NOT NULL,
    start_price BIGINT NOT NULL,
    reserve_price BIGINT NOT NULL,
    clearing_price BIGINT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auction queries
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_creator ON auctions(creator);

-- Bid aggregates table (only public aggregate data, not individual bids)
CREATE TABLE IF NOT EXISTS bid_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id TEXT UNIQUE NOT NULL REFERENCES auctions(auction_id),
    bid_count BIGINT DEFAULT 0,
    total_volume BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id TEXT NOT NULL REFERENCES auctions(auction_id),
    user_address TEXT NOT NULL,
    items_claimed BIGINT NOT NULL,
    amount_paid BIGINT NOT NULL,
    refund_amount BIGINT DEFAULT 0,
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user claims
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_address);
CREATE INDEX IF NOT EXISTS idx_claims_auction ON claims(auction_id);

-- Price history for charts (optional)
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id TEXT NOT NULL REFERENCES auctions(auction_id),
    price BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_auction ON price_history(auction_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_aggregates_updated_at
    BEFORE UPDATE ON bid_aggregates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Public read access for auctions
CREATE POLICY "Auctions are publicly readable" ON auctions
    FOR SELECT USING (true);

-- Public read access for bid aggregates
CREATE POLICY "Bid aggregates are publicly readable" ON bid_aggregates
    FOR SELECT USING (true);

-- Users can only read their own claims
CREATE POLICY "Users can read own claims" ON claims
    FOR SELECT USING (true);

-- Public read access for price history
CREATE POLICY "Price history is publicly readable" ON price_history
    FOR SELECT USING (true);

-- Service role can do everything (for indexer)
-- Note: The service role key bypasses RLS

-- Sample data for testing (optional)
INSERT INTO auctions (
    auction_id, creator, item_name, item_description,
    total_supply, remaining_supply, start_price, reserve_price,
    start_time, end_time, status
) VALUES 
(
    'demo001abc',
    'aleo1demo...',
    'Rare NFT Collection',
    'A collection of 100 unique digital art pieces with exclusive access.',
    100, 45, 10000, 2000,
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '4 hours',
    1
),
(
    'demo002def',
    'aleo1demo...',
    'Premium Access Pass',
    'Exclusive access to EquiClear premium features.',
    50, 50, 5000, 1000,
    NOW() + INTERVAL '2 hours',
    NOW() + INTERVAL '8 hours',
    0
),
(
    'demo003ghi',
    'aleo1demo...',
    'Genesis Tokens',
    'Limited edition genesis tokens for early supporters.',
    200, 0, 3000, 500,
    NOW() - INTERVAL '10 hours',
    NOW() - INTERVAL '2 hours',
    2
)
ON CONFLICT (auction_id) DO NOTHING;

-- Insert sample bid aggregates
INSERT INTO bid_aggregates (auction_id, bid_count, total_volume) VALUES
('demo001abc', 23, 1150),
('demo002def', 0, 0),
('demo003ghi', 89, 4450)
ON CONFLICT (auction_id) DO NOTHING;
