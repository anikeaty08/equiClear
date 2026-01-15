// EquiClear - Aleo Wallet Integration
// Supports Leo Wallet (via official adapter) and Puzzle Wallet (via SDK)

import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { WalletAdapterNetwork, DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import {
    connect as puzzleConnect,
    disconnect as puzzleDisconnect,
    requestCreateEvent,
    getAccount,
    Network
} from '@puzzlehq/sdk-core';

// Contract program names
const CONTRACTS = {
    BALANCE: process.env.NEXT_PUBLIC_BALANCE_CONTRACT || 'equiclear_balance.aleo',
    AUCTION: process.env.NEXT_PUBLIC_AUCTION_CONTRACT || 'equiclear_auction.aleo',
    BID: process.env.NEXT_PUBLIC_BID_CONTRACT || 'equiclear_bid.aleo',
    CLAIM: process.env.NEXT_PUBLIC_CLAIM_CONTRACT || 'equiclear_claim.aleo',
};

// Program IDs for Puzzle Wallet permissions
const PROGRAM_IDS = [
    CONTRACTS.BALANCE,
    CONTRACTS.AUCTION,
    CONTRACTS.BID,
    CONTRACTS.CLAIM,
];

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

type WalletProvider = 'leo' | 'puzzle' | null;

class AleoWallet {
    private leoAdapter: LeoWalletAdapter | null = null;
    private connected: boolean = false;
    private address: string | null = null;
    private provider: WalletProvider = null;

    constructor() {
        // Initialize Leo adapter only in browser
        if (typeof window !== 'undefined') {
            this.initLeoAdapter();
        }
    }

    private initLeoAdapter() {
        try {
            this.leoAdapter = new LeoWalletAdapter({
                appName: 'EquiClear',
            });

            this.leoAdapter.on('connect', () => {
                if (this.provider === 'leo') {
                    this.connected = true;
                    this.address = this.leoAdapter?.publicKey || null;
                    console.log('Leo Wallet connected:', this.address);
                }
            });

            this.leoAdapter.on('disconnect', () => {
                if (this.provider === 'leo') {
                    this.connected = false;
                    this.address = null;
                    console.log('Leo Wallet disconnected');
                }
            });

            this.leoAdapter.on('error', (error) => {
                console.error('Leo Wallet error:', error);
            });
        } catch (error) {
            console.error('Failed to initialize Leo Wallet adapter:', error);
        }
    }

    // Check if any wallet extension is installed
    isWalletAvailable(): boolean {
        if (typeof window === 'undefined') return false;
        // Check for Leo Wallet or Puzzle Wallet
        return !!(window as any).leoWallet ||
               !!(window as any).aleo ||
               !!(window as any).puzzle ||
               !!(window as any).puzzleWallet;
    }

    // Detect which wallet is available
    private detectWallet(): WalletProvider {
        if (typeof window === 'undefined') return null;
        // Check for Puzzle Wallet first (since user mentioned they have it)
        if ((window as any).puzzle || (window as any).puzzleWallet) {
            console.log('Puzzle Wallet detected');
            return 'puzzle';
        }
        // Check for Leo Wallet
        if ((window as any).leoWallet || (window as any).aleo) {
            console.log('Leo Wallet detected');
            return 'leo';
        }
        return null;
    }

    // Connect to Wallet - tries Puzzle first, then Leo
    async connect(): Promise<WalletState> {
        if (typeof window === 'undefined') {
            throw new Error('Wallet can only be connected in browser');
        }

        // Try Puzzle Wallet first
        try {
            console.log('Attempting Puzzle Wallet connection...');

            // Use the correct Puzzle SDK API format
            const puzzleResponse = await puzzleConnect({
                dAppInfo: {
                    name: 'EquiClear',
                    description: 'Decentralized Dutch Auction Platform on Aleo',
                    iconUrl: `${window.location.origin}/logo.png`,
                },
                permissions: {
                    programIds: {
                        [Network.AleoTestnet]: PROGRAM_IDS,
                    },
                },
            });

            console.log('Puzzle connect response:', puzzleResponse);

            // Extract address from connection response
            const address = puzzleResponse?.connection?.address;

            if (address) {
                this.provider = 'puzzle';
                this.address = address;
                this.connected = true;
                console.log('Puzzle Wallet connected:', address);

                return {
                    connected: true,
                    address: address,
                    balance: 0,
                    network: 'testnet',
                };
            }

            // Fallback: try getAccount if no address in response
            try {
                const accountInfo = await getAccount();
                const fallbackAddress = (accountInfo as any)?.address || (accountInfo as any)?.account;
                console.log('Puzzle getAccount result:', accountInfo);

                if (fallbackAddress) {
                    this.provider = 'puzzle';
                    this.address = fallbackAddress;
                    this.connected = true;
                    console.log('Puzzle Wallet connected via getAccount:', fallbackAddress);

                    return {
                        connected: true,
                        address: fallbackAddress,
                        balance: 0,
                        network: 'testnet',
                    };
                }
            } catch (e) {
                console.log('getAccount failed:', e);
            }
        } catch (puzzleError: any) {
            console.log('Puzzle Wallet connection failed:', puzzleError?.message || puzzleError);
            // Don't throw yet, try Leo Wallet
        }

        // Try Leo Wallet as fallback
        if (!this.leoAdapter) {
            this.initLeoAdapter();
        }

        if (this.leoAdapter) {
            try {
                console.log('Attempting Leo Wallet connection...');

                await this.leoAdapter.connect(
                    DecryptPermission.UponRequest,
                    WalletAdapterNetwork.TestnetBeta
                );

                const publicKey = this.leoAdapter.publicKey;

                if (publicKey) {
                    this.provider = 'leo';
                    this.address = publicKey;
                    this.connected = true;
                    console.log('Leo Wallet connected:', publicKey);

                    return {
                        connected: true,
                        address: publicKey,
                        balance: 0,
                        network: 'testnet',
                    };
                }
            } catch (leoError: any) {
                console.log('Leo Wallet connection failed:', leoError?.message || leoError);

                if (leoError?.message?.includes('reject') || leoError?.name === 'WalletConnectionError') {
                    throw new Error('Connection rejected by user');
                }
            }
        }

        // No wallet connected
        throw new Error(
            'No compatible Aleo wallet found. Please install Puzzle Wallet or Leo Wallet extension.'
        );
    }

    // Disconnect wallet
    async disconnect(): Promise<void> {
        try {
            if (this.provider === 'puzzle') {
                await puzzleDisconnect();
            } else if (this.provider === 'leo' && this.leoAdapter) {
                await this.leoAdapter.disconnect();
            }
        } catch (e) {
            console.warn('Disconnect error:', e);
        }
        this.connected = false;
        this.address = null;
        this.provider = null;
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

    getAddress(): string | null {
        return this.address;
    }

    isConnected(): boolean {
        return this.connected;
    }

    getProvider(): WalletProvider {
        return this.provider;
    }

    // Submit transaction
    async submitTransaction(
        program: string,
        functionName: string,
        inputs: string[],
        fee: number = 100000
    ): Promise<TransactionResult> {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`Submitting transaction to ${program}::${functionName}`);
            console.log('Inputs:', inputs);
            console.log('Using provider:', this.provider);

            let txId: string | undefined;

            if (this.provider === 'puzzle') {
                // Use Puzzle SDK
                const result = await requestCreateEvent({
                    type: 'Execute',
                    programId: program,
                    functionId: functionName,
                    inputs: inputs,
                    fee: fee / 1000000, // Puzzle uses credits not microcredits
                } as any);

                txId = (result as any)?.eventId ||
                       (result as any)?.transactionId ||
                       (result as any)?.id;

            } else if (this.provider === 'leo' && this.leoAdapter) {
                // Use Leo Wallet adapter
                const result = await this.leoAdapter.requestExecution({
                    programId: program,
                    functionName: functionName,
                    inputs: inputs,
                    fee: fee,
                } as any);

                txId = result as string;
            }

            if (txId) {
                console.log('Transaction submitted:', txId);
                return { success: true, txId };
            }

            return { success: false, error: 'No transaction ID returned' };

        } catch (error: any) {
            console.error('Transaction error:', error);
            return {
                success: false,
                error: error.message || 'Transaction failed',
            };
        }
    }

    // ============================================
    // Helper Methods
    // ============================================

    private stringToField(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `${Math.abs(hash)}field`;
    }

    // WRAPPER METHODS

    async deposit(tokenId: string, amount: number): Promise<TransactionResult> {
        const tokenIdField = tokenId.includes('field') ? tokenId : `${tokenId}field`;
        return this.submitTransaction(CONTRACTS.BALANCE, 'deposit', [
            this.address!,
            tokenIdField,
            `${amount}u64`,
            `${Date.now()}u64`
        ]);
    }

    async withdraw(tokenId: string, amount: number): Promise<TransactionResult> {
        return this.submitTransaction(CONTRACTS.BALANCE, 'withdraw', [
            this.address!,
            '{}',
            `${amount}u64`,
            `${Date.now()}u64`
        ]);
    }

    async withdrawWithRecord(record: string, amount: number): Promise<TransactionResult> {
        return this.submitTransaction(CONTRACTS.BALANCE, 'withdraw', [
            this.address!,
            record,
            `${amount}u64`,
            `${Date.now()}u64`
        ]);
    }

    async createAuction(
        item: string,
        supply: number,
        start: number,
        reserve: number,
        startTime: number,
        endTime: number
    ): Promise<TransactionResult> {
        return this.submitTransaction(CONTRACTS.AUCTION, 'create_auction', [
            this.address!,
            this.stringToField(item),
            `${supply}u64`,
            `${start}u64`,
            `${reserve}u64`,
            `${startTime}u64`,
            `${endTime}u64`
        ]);
    }

    async placeBid(auctionId: string, qty: number, price: number): Promise<TransactionResult> {
        const aid = auctionId.includes('field') ? auctionId : `${auctionId}field`;
        return this.submitTransaction(CONTRACTS.BID, 'place_bid', [
            this.address!,
            '{}',
            aid,
            `${qty}u64`,
            `${price}u64`,
            `${Date.now()}u64`
        ]);
    }

    async claimItems(auctionId: string): Promise<TransactionResult> {
        return this.submitTransaction(CONTRACTS.CLAIM, 'claim_items', [
            this.address!,
            '{}',
            `${Date.now()}u64`
        ]);
    }
}

export const aleoWallet = new AleoWallet();
export default aleoWallet;
