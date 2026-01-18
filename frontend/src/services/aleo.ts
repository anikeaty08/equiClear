// EquiClear - Aleo Blockchain Service
// For reading on-chain data and interacting with the Aleo network

const API_ENDPOINT = process.env.NEXT_PUBLIC_INDEXER_URL || 'https://api.explorer.provable.com/v1';
const NETWORK = process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet';

// Contract program names
export const CONTRACTS = {
    BALANCE: process.env.NEXT_PUBLIC_BALANCE_CONTRACT || 'equiclear_balance_v2.aleo',
    AUCTION: process.env.NEXT_PUBLIC_AUCTION_CONTRACT || 'equiclear_auction.aleo',
    BID: process.env.NEXT_PUBLIC_BID_CONTRACT || 'equiclear_bid.aleo',
    CLAIM: process.env.NEXT_PUBLIC_CLAIM_CONTRACT || 'equiclear_claim.aleo',
};

export interface MappingValue {
    key: string;
    value: string;
}

export interface TransactionInfo {
    id: string;
    type: string;
    status: string;
    timestamp: string;
    fee: number;
}

class AleoService {
    private endpoint: string;
    private network: string;

    constructor() {
        this.endpoint = API_ENDPOINT;
        this.network = NETWORK;
    }

    // Get the API base URL for the Aleo explorer
    private getExplorerUrl(): string {
        return `https://api.explorer.provable.com/v1`;
    }

    // Fetch mapping value from a program
    async getMappingValue(
        programId: string,
        mappingName: string,
        key: string
    ): Promise<string | null> {
        try {
            const url = `${this.getExplorerUrl()}/${this.network}/program/${programId}/mapping/${mappingName}/${key}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to fetch mapping: ${response.statusText}`);
            }

            const value = await response.text();
            return value.replace(/"/g, '');
        } catch (error) {
            console.error(`Error fetching mapping ${mappingName}[${key}]:`, error);
            return null;
        }
    }

    // Get program info
    async getProgram(programId: string): Promise<any> {
        try {
            const url = `${this.getExplorerUrl()}/${this.network}/program/${programId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch program: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching program ${programId}:`, error);
            return null;
        }
    }

    // Get transaction by ID
    async getTransaction(txId: string): Promise<TransactionInfo | null> {
        try {
            const url = `${this.getExplorerUrl()}/${this.network}/transaction/${txId}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to fetch transaction: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching transaction ${txId}:`, error);
            return null;
        }
    }

    // Check if a program is deployed
    async isProgramDeployed(programId: string): Promise<boolean> {
        try {
            const program = await this.getProgram(programId);
            return program !== null;
        } catch {
            return false;
        }
    }

    // ============================================
    // Balance Contract Mappings
    // ============================================

    // Get total deposits for a token
    async getTotalDeposits(tokenId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.BALANCE,
            'total_deposits',
            `${tokenId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // ============================================
    // Auction Contract Mappings
    // ============================================

    // Check if auction exists
    async auctionExists(auctionId: string): Promise<boolean> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auctions',
            `${auctionId}field`
        );
        return value === 'true';
    }

    // Get auction status
    async getAuctionStatus(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_status',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u8', '')) : -1;
    }

    // Get auction supply
    async getAuctionSupply(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_supply',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // Get auction clearing price
    async getAuctionClearingPrice(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_clearing_price',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // Get total auction count
    async getAuctionCount(): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_counter',
            '0u8'
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // ============================================
    // Bid Contract Mappings
    // ============================================

    // Get bid count for an auction
    async getBidCount(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.BID,
            'bid_counts',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // Get total bid volume for an auction
    async getTotalBidVolume(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.BID,
            'total_bid_volume',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // ============================================
    // Claim Contract Mappings
    // ============================================

    // Get claim count for an auction
    async getClaimCount(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.CLAIM,
            'claim_counts',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // Get total claimed items for an auction
    async getTotalClaimed(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.CLAIM,
            'total_claimed',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // Get total refunds processed for an auction
    async getRefundsProcessed(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.CLAIM,
            'refunds_processed',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    // ============================================
    // Utility Functions
    // ============================================

    // Parse Aleo value type (remove type suffix)
    parseValue(value: string): number | string | boolean {
        if (!value) return 0;

        // Remove quotes if present
        value = value.replace(/"/g, '');

        // Check for boolean
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Check for numeric types
        const numMatch = value.match(/^(\d+)(u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|field)?$/);
        if (numMatch) {
            return parseInt(numMatch[1]);
        }

        // Check for address
        if (value.startsWith('aleo1')) {
            return value;
        }

        return value;
    }

    // Get auction status label
    getAuctionStatusLabel(status: number): string {
        switch (status) {
            case 0: return 'Created';
            case 1: return 'Active';
            case 2: return 'Settled';
            case 3: return 'Cancelled';
            default: return 'Unknown';
        }
    }
}

// Singleton instance
export const aleoService = new AleoService();
export default aleoService;
