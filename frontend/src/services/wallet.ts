// EquiClear - Aleo Wallet Integration
// Supports Puzzle Wallet and other Aleo wallets

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

    // Submit transaction to Aleo program
    async submitTransaction(
        program: string,
        functionName: string,
        inputs: Record<string, any>
    ): Promise<TransactionResult> {
        if (!this.connected || !this.puzzleWallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const result = await this.puzzleWallet.requestTransaction({
                program,
                function: functionName,
                inputs: Object.values(inputs),
                fee: 100000, // Default fee in microcredits
            });

            if (result && result.transactionId) {
                return {
                    success: true,
                    txId: result.transactionId,
                };
            }

            return {
                success: false,
                error: 'Transaction failed',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Transaction failed',
            };
        }
    }

    // Deposit tokens
    async deposit(tokenId: string, amount: number): Promise<TransactionResult> {
        return this.submitTransaction('equiclear_balance.aleo', 'deposit', {
            token_id: tokenId,
            amount: `${amount}u64`,
            timestamp: `${Date.now()}u64`,
        });
    }

    // Withdraw tokens
    async withdraw(tokenId: string, amount: number): Promise<TransactionResult> {
        return this.submitTransaction('equiclear_balance.aleo', 'withdraw', {
            token_id: tokenId,
            withdraw_amount: `${amount}u64`,
            timestamp: `${Date.now()}u64`,
        });
    }

    // Place bid
    async placeBid(
        auctionId: string,
        quantity: number,
        maxPrice: number
    ): Promise<TransactionResult> {
        return this.submitTransaction('equiclear_bid.aleo', 'place_bid', {
            auction_id: auctionId,
            quantity: `${quantity}u64`,
            max_price: `${maxPrice}u64`,
            timestamp: `${Date.now()}u64`,
        });
    }

    // Claim items
    async claimItems(auctionId: string): Promise<TransactionResult> {
        return this.submitTransaction('equiclear_claim.aleo', 'claim_items', {
            auction_id: auctionId,
            timestamp: `${Date.now()}u64`,
        });
    }

    // Create auction
    async createAuction(
        itemName: string,
        itemDescription: string,
        totalSupply: number,
        startPrice: number,
        reservePrice: number,
        startTime: number,
        endTime: number
    ): Promise<TransactionResult> {
        return this.submitTransaction('equiclear_auction.aleo', 'create_auction', {
            item_name: itemName,
            item_description: itemDescription,
            total_supply: `${totalSupply}u64`,
            start_price: `${startPrice}u64`,
            reserve_price: `${reservePrice}u64`,
            start_time: `${startTime}u64`,
            end_time: `${endTime}u64`,
        });
    }
}

// Singleton instance
export const aleoWallet = new AleoWallet();
export default aleoWallet;
