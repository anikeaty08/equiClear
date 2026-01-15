// EquiClear - Aleo Wallet Integration
// Supports Puzzle Wallet and other Aleo wallets

// Contract program names
const CONTRACTS = {
    BALANCE: process.env.NEXT_PUBLIC_BALANCE_CONTRACT || 'equiclear_balance.aleo',
    AUCTION: process.env.NEXT_PUBLIC_AUCTION_CONTRACT || 'equiclear_auction.aleo',
    BID: process.env.NEXT_PUBLIC_BID_CONTRACT || 'equiclear_bid.aleo',
    CLAIM: process.env.NEXT_PUBLIC_CLAIM_CONTRACT || 'equiclear_claim.aleo',
};

export interface WalletState {
    connected: boolean;
    address: string | null;
    balance: number;
    network: 'testnet' | 'mainnet';
}

export interface TransactionResult {
    success: boolean;
    txId?: string;
    error?: string;
}

class AleoWallet {
    private connected: boolean = false;
    private address: string | null = null;
    private puzzleWallet: any = null;

    // Check if Puzzle Wallet is available
    isPuzzleAvailable(): boolean {
        return typeof window !== 'undefined' && !!(window as any).puzzle;
    }

    // Connect to Puzzle Wallet
    async connect(): Promise<WalletState> {
        if (typeof window === 'undefined') {
            throw new Error('Wallet can only be connected in browser');
        }

        try {
            // Check for Puzzle Wallet
            if (this.isPuzzleAvailable()) {
                this.puzzleWallet = (window as any).puzzle;

                // Request connection
                const response = await this.puzzleWallet.connect();

                if (response && response.address) {
                    this.connected = true;
                    this.address = response.address;

                    return {
                        connected: true,
                        address: this.address,
                        balance: 0, // Will be fetched separately
                        network: 'testnet',
                    };
                }
            }

            throw new Error('Puzzle Wallet not found. Please install the extension.');
        } catch (error: any) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    // Disconnect wallet
    async disconnect(): Promise<void> {
        if (this.puzzleWallet) {
            try {
                await this.puzzleWallet.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
        }
        this.connected = false;
        this.address = null;
    }

    // Get current state
    getState(): WalletState {
        return {
            connected: this.connected,
            address: this.address,
            balance: 0,
            network: 'testnet',
        };
    }

    // Get connected address
    getAddress(): string | null {
        return this.address;
    }

    // Submit transaction to Aleo program
    async submitTransaction(
        program: string,
        functionName: string,
        inputs: string[],
        fee: number = 100000
    ): Promise<TransactionResult> {
        if (!this.connected || !this.puzzleWallet) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`Submitting transaction to ${program}::${functionName}`);
            console.log('Inputs:', inputs);

            const result = await this.puzzleWallet.requestTransaction({
                program,
                function: functionName,
                inputs,
                fee, // Fee in microcredits
            });

            if (result && result.transactionId) {
                console.log('Transaction submitted:', result.transactionId);
                return {
                    success: true,
                    txId: result.transactionId,
                };
            }

            return {
                success: false,
                error: 'Transaction failed - no transaction ID returned',
            };
        } catch (error: any) {
            console.error('Transaction error:', error);
            return {
                success: false,
                error: error.message || 'Transaction failed',
            };
        }
    }

    // ============================================
    // Balance Contract Functions
    // ============================================

    // Deposit tokens into internal balance (simplified - creates new balance record)
    async deposit(tokenId: string, amount: number): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        // Format token_id as field (remove 'field' suffix if present, then add it)
        const tokenIdField = tokenId.includes('field') ? tokenId : `${tokenId}field`;

        return this.submitTransaction(
            CONTRACTS.BALANCE,
            'deposit',
            [
                this.address,           // recipient: address
                tokenIdField,           // token_id: field
                `${amount}u64`,         // amount: u64
                `${Date.now()}u64`,     // timestamp: u64
            ]
        );
    }

    // Withdraw tokens (requires a balance record - for advanced use)
    async withdrawWithRecord(
        balanceRecord: string,
        withdrawAmount: number
    ): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        return this.submitTransaction(
            CONTRACTS.BALANCE,
            'withdraw',
            [
                this.address,               // recipient: address
                balanceRecord,              // balance: Balance record
                `${withdrawAmount}u64`,     // withdraw_amount: u64
                `${Date.now()}u64`,         // timestamp: u64
            ]
        );
    }

    // Simplified withdraw (for demo/testing - placeholder record)
    async withdraw(tokenId: string, amount: number): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        console.warn('withdraw: In production, this requires a Balance record from the wallet');

        const tokenIdField = tokenId.includes('field') ? tokenId : `${tokenId}field`;

        // Note: This will fail without a valid balance record
        // For demo purposes, we return a simulated success
        // In production, the wallet would provide the actual record
        return this.submitTransaction(
            CONTRACTS.BALANCE,
            'withdraw',
            [
                this.address,               // recipient: address
                '{}',                       // balance: Balance record (placeholder)
                `${amount}u64`,             // withdraw_amount: u64
                `${Date.now()}u64`,         // timestamp: u64
            ]
        );
    }

    // ============================================
    // Auction Contract Functions
    // ============================================

    // Create a new auction (simplified interface for frontend)
    async createAuction(
        itemName: string,
        totalSupply: number,
        startPrice: number,
        reservePrice: number,
        startTime: number,
        endTime: number
    ): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        // Convert itemName to a field (simple hash)
        const itemNameHash = this.stringToField(itemName);

        return this.submitTransaction(
            CONTRACTS.AUCTION,
            'create_auction',
            [
                this.address,               // auction_owner: address
                itemNameHash,               // item_name: field
                `${totalSupply}u64`,        // total_supply: u64
                `${startPrice}u64`,         // start_price: u64
                `${reservePrice}u64`,       // reserve_price: u64
                `${startTime}u64`,          // start_time: u64
                `${endTime}u64`,            // end_time: u64
            ]
        );
    }

    // Activate an auction (requires auction record)
    async activateAuction(auctionRecord: string): Promise<TransactionResult> {
        const currentTime = Math.floor(Date.now() / 1000);

        return this.submitTransaction(
            CONTRACTS.AUCTION,
            'activate_auction',
            [
                auctionRecord,              // auction: Auction record
                `${currentTime}u64`,        // current_time: u64
            ]
        );
    }

    // ============================================
    // Bid Contract Functions
    // ============================================

    // Place bid - simplified interface (requires balance record in production)
    // For demo purposes, this shows the expected flow
    async placeBid(
        auctionId: string,
        quantity: number,
        maxPrice: number
    ): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        // In production, you would:
        // 1. Get user's balance record from their wallet
        // 2. Pass it to the place_bid function

        // For now, we'll return an error explaining the requirement
        // In a real implementation, the wallet extension would provide the records

        console.warn('placeBid: In production, this requires a Balance record from the wallet');

        // Format auction_id as field
        const auctionIdField = auctionId.includes('field') ? auctionId : `${auctionId}field`;

        // Note: This will fail without a valid balance record
        // The Puzzle Wallet should be able to provide records the user owns
        return this.submitTransaction(
            CONTRACTS.BID,
            'place_bid',
            [
                this.address,               // bidder: address
                '{}',                       // balance: Balance record (placeholder - wallet should provide)
                auctionIdField,             // auction_id: field
                `${quantity}u64`,           // quantity: u64
                `${maxPrice}u64`,           // max_price: u64
                `${Date.now()}u64`,         // timestamp: u64
            ]
        );
    }

    // Place bid with explicit balance record (for production use)
    async placeBidWithRecord(
        balanceRecord: string,
        auctionId: string,
        quantity: number,
        maxPrice: number
    ): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        const auctionIdField = auctionId.includes('field') ? auctionId : `${auctionId}field`;

        return this.submitTransaction(
            CONTRACTS.BID,
            'place_bid',
            [
                this.address,               // bidder: address
                balanceRecord,              // balance: Balance record
                auctionIdField,             // auction_id: field
                `${quantity}u64`,           // quantity: u64
                `${maxPrice}u64`,           // max_price: u64
                `${Date.now()}u64`,         // timestamp: u64
            ]
        );
    }

    // ============================================
    // Claim Contract Functions
    // ============================================

    // Claim items (simplified interface)
    async claimItems(auctionId: string): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        // In production, this would require a WinClaim record
        console.warn('claimItems: In production, this requires a WinClaim record');

        return this.submitTransaction(
            CONTRACTS.CLAIM,
            'claim_items',
            [
                this.address,           // claimant: address
                '{}',                   // claim: WinClaim record (placeholder)
                `${Date.now()}u64`,     // timestamp: u64
            ]
        );
    }

    // Claim and refund together (requires settlement record)
    async claimAndRefund(settlementRecord: string): Promise<TransactionResult> {
        if (!this.address) {
            throw new Error('Wallet not connected');
        }

        return this.submitTransaction(
            CONTRACTS.CLAIM,
            'claim_and_refund',
            [
                this.address,           // recipient: address
                settlementRecord,       // settlement: Settlement record
                `${Date.now()}u64`,     // timestamp: u64
            ]
        );
    }

    // ============================================
    // Utility Functions
    // ============================================

    // Convert a string to a field value (simple hash)
    private stringToField(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Ensure positive number
        const positiveHash = Math.abs(hash);
        return `${positiveHash}field`;
    }

    // Format address for display (truncate middle)
    formatAddress(address: string, chars: number = 6): string {
        if (!address) return '';
        return `${address.slice(0, chars)}...${address.slice(-chars)}`;
    }
}

// Singleton instance
export const aleoWallet = new AleoWallet();
export default aleoWallet;
