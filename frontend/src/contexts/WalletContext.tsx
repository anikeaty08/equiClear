'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    PuzzleWalletProvider,
    useConnect,
    useAccount,
    useDisconnect
} from '@puzzlehq/sdk';
import { Network } from '@puzzlehq/sdk-core';
import { aleoWallet } from '@/services/wallet';

interface WalletState {
    connected: boolean;
    address: string | null;
    balance: number;
    network: string;
    loading: boolean;
    providerType: 'leo' | 'puzzle' | null;
}

interface WalletContextType extends WalletState {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    return (
        <PuzzleWalletProvider>
            <WalletInner>{children}</WalletInner>
        </PuzzleWalletProvider>
    );
}

function WalletInner({ children }: { children: React.ReactNode }) {
    const { account } = useAccount();

    // Configure connection request
    const connectRequest = {
        dAppInfo: {
            name: "EquiClear",
            description: "EquiClear - Decentralized Dutch Auctions",
            iconUrl: "http://localhost:3000/logo.png"
        },
        permissions: {
            // @ts-ignore - The structure might vary slightly by version, checking basic structure
            programIds: {
                [Network.AleoTestnet]: [
                    'equiclear_balance.aleo',
                    'equiclear_auction.aleo',
                    'equiclear_bid.aleo',
                    'equiclear_claim.aleo'
                ]
            }
        }
    };

    // @ts-ignore
    const { connect, loading: connectLoading, error: connectError } = useConnect(connectRequest);
    const { disconnect, loading: disconnectLoading } = useDisconnect();

    const [balance, setBalance] = useState(0);

    // Derived state
    const connected = !!account;
    const address = account ? account.address : null;
    const network = account ? account.network : 'testnet';
    const loading = connectLoading || disconnectLoading;

    // Sync with AleoWallet service for non-React components
    useEffect(() => {
        if (aleoWallet) {
            (aleoWallet as any).setAccount(address);
        }
    }, [address]);

    // Wrapper for connect to handle specific permissions
    const handleConnect = async () => {
        try {
            await connect();
        } catch (e) {
            console.error("Connection failed", e);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (e) {
            console.error("Disconnect failed", e);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                connected,
                address,
                balance: 0, // TODO: Fetch real balance using useRecords or useBalance
                network,
                loading,
                providerType: 'puzzle', // Defaulting to puzzle/unified
                connect: handleConnect,
                disconnect: handleDisconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
