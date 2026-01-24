// EquiClear API Client - Indexer Communication

// In production (Vercel), use the Render backend URL
// In development, use localhost:3001
const getApiBase = () => {
    // First check for explicit env var
    if (process.env.NEXT_PUBLIC_INDEXER_URL) {
        return process.env.NEXT_PUBLIC_INDEXER_URL;
    }
    // In browser, check if we're on production domain
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app') || hostname.includes('equiclear')) {
            return 'https://equiclear.onrender.com';
        }
    }
    // Default for local development
    return 'http://localhost:3001';
};

export interface Auction {
    id: string;
    auction_id: string;
    creator: string;
    item_name: string;
    item_description?: string;
    total_supply: number;
    remaining_supply: number;
    start_price: number;
    reserve_price: number;
    clearing_price?: number;
    start_time: string;
    end_time: string;
    status: number;
    created_at?: string;
    updated_at?: string;
}

export interface BidAggregate {
    auction_id: string;
    bid_count: number;
    total_volume: number;
    updated_at: string;
}

export interface CurrentPrice {
    auction_id: string;
    current_price: number;
    time_remaining: number;
    progress_percent: number;
}

export interface Claim {
    id: string;
    auction_id: string;
    user_address: string;
    items_claimed: number;
    amount_paid: number;
    refund_amount: number;
    claimed_at: string;
}

export interface Stats {
    total_auctions: number;
    active_auctions: number;
    total_volume: number;
    total_bids: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

class ApiClient {
    private baseUrl: string | null = null;

    constructor(baseUrl?: string) {
        if (baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    // Lazily get the base URL - computed on first API call to ensure we're in the browser
    private getBaseUrl(): string {
        if (this.baseUrl) {
            return this.baseUrl.replace(/\/$/, '');
        }
        this.baseUrl = getApiBase().replace(/\/$/, '');
        return this.baseUrl;
    }

    private async fetch<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.getBaseUrl()}${endpoint}`);
            const json: ApiResponse<T> = await response.json();

            if (!json.success || !json.data) {
                throw new Error(json.error || 'API request failed');
            }

            return json.data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auctions
    async getAuctions(status?: string): Promise<Auction[]> {
        const query = status ? `?status=${status}` : '';
        return this.fetch<Auction[]>(`/api/auctions${query}`);
    }

    async getAuction(id: string): Promise<Auction> {
        return this.fetch<Auction>(`/api/auctions/${id}`);
    }

    async getCurrentPrice(id: string): Promise<CurrentPrice> {
        return this.fetch<CurrentPrice>(`/api/auctions/${id}/price`);
    }

    async getBidAggregate(id: string): Promise<BidAggregate> {
        return this.fetch<BidAggregate>(`/api/auctions/${id}/bids`);
    }

    // User
    async getUserClaims(address: string): Promise<Claim[]> {
        return this.fetch<Claim[]>(`/api/user/${address}/claims`);
    }

    // Stats
    async getStats(): Promise<Stats> {
        return this.fetch<Stats>(`/api/stats`);
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.getBaseUrl()}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const api = new ApiClient();
export default api;
