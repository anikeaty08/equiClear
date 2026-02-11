// EquiClear - Aleo Blockchain Service
// For reading on-chain data and interacting with the Aleo network

const API_ENDPOINT = process.env.NEXT_PUBLIC_INDEXER_URL || 'https://api.explorer.provable.com/v1';
const NETWORK = process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet';

// Single unified auction program
export const CONTRACTS = {
    AUCTION: process.env.NEXT_PUBLIC_AUCTION_CONTRACT || 'equiclear_auction_4829.aleo',
};

// Auction type used throughout the frontend
export interface Auction {
    auction_id: string;
    creator: string;
    item_name: string;
    total_supply: number;
    remaining_supply: number;
    start_price: number;
    reserve_price: number;
    clearing_price: number;
    start_time: number;  // unix seconds
    end_time: number;    // unix seconds
    status: number;      // 0=created, 1=active, 2=settled, 3=cancelled
    bid_count: number;
}

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
    // Auction Mappings (unified contract)
    // ============================================

    async auctionExists(auctionId: string): Promise<boolean> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auctions',
            `${auctionId}field`
        );
        return value === 'true';
    }

    async getAuctionStatus(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_status',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u8', '')) : -1;
    }

    async getAuctionSupply(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_supply',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async getAuctionClearingPrice(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_clearing_price',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async getAuctionStartPrice(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_start_price',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async getAuctionReservePrice(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_reserve_price',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async getAuctionCount(): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'auction_counter',
            '0u8'
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async getBidCount(auctionId: string): Promise<number> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'bid_count',
            `${auctionId}field`
        );
        return value ? parseInt(value.replace('u64', '')) : 0;
    }

    async isRedeemed(bidId: string): Promise<boolean> {
        const value = await this.getMappingValue(
            CONTRACTS.AUCTION,
            'redemptions',
            `${bidId}field`
        );
        return value === 'true';
    }

    // ============================================
    // Composite Fetchers
    // ============================================

    // Fetch full auction data from on-chain mappings by auction_id
    async getAuction(auctionId: string): Promise<Auction | null> {
        const key = auctionId.includes('field') ? auctionId : `${auctionId}field`;
        const exists = await this.getMappingValue(CONTRACTS.AUCTION, 'auctions', key);
        if (exists !== 'true') return null;

        const [statusVal, supplyVal, startPriceVal, reservePriceVal, clearingPriceVal, startTimeVal, endTimeVal, bidCountVal, ownerVal] = await Promise.all([
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_status', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_supply', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_start_price', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_reserve_price', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_clearing_price', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_start_time', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_end_time', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'bid_count', key),
            this.getMappingValue(CONTRACTS.AUCTION, 'auction_owners', key),
        ]);

        const parseNum = (v: string | null, suffix: string = 'u64') =>
            v ? parseInt(v.replace(suffix, '')) : 0;

        return {
            auction_id: auctionId.replace('field', ''),
            creator: ownerVal || '',
            item_name: `Auction ${auctionId.replace('field', '').slice(0, 8)}`,
            total_supply: parseNum(supplyVal),
            remaining_supply: parseNum(supplyVal),
            start_price: parseNum(startPriceVal),
            reserve_price: parseNum(reservePriceVal),
            clearing_price: parseNum(clearingPriceVal),
            start_time: parseNum(startTimeVal),
            end_time: parseNum(endTimeVal),
            status: parseNum(statusVal, 'u8'),
            bid_count: parseNum(bidCountVal),
        };
    }

    // ============================================
    // Utility Functions
    // ============================================

    parseValue(value: string): number | string | boolean {
        if (!value) return 0;

        value = value.replace(/"/g, '');

        if (value === 'true') return true;
        if (value === 'false') return false;

        const numMatch = value.match(/^(\d+)(u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|field)?$/);
        if (numMatch) {
            return parseInt(numMatch[1]);
        }

        if (value.startsWith('aleo1')) {
            return value;
        }

        return value;
    }

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
