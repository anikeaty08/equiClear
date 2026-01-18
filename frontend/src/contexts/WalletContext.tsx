'use client';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
    PuzzleWalletProvider,
    useAccount,
    useConnect,
    useDisconnect,
    useRecords,
    useIsConnected,
    Network
} from '@puzzlehq/sdk';
import { requestSignature } from '@puzzlehq/sdk-core';
import { aleoWallet } from '@/services/wallet';
import { useStore } from '@/store';
import { calculateTotalBalance } from '@/services/balance';
import { CONTRACTS } from '@/services/aleo';

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
    const { isConnected } = useIsConnected();
    
    // Track if user explicitly connected (clicked button) - prevents auto-connection
    const [explicitlyConnected, setExplicitlyConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Configure connection request for Puzzle wallet
    const connectRequest = useMemo(() => ({
        dAppInfo: {
            name: "EquiClear",
            description: "EquiClear - Decentralized Dutch Auctions on Aleo",
            iconUrl: typeof window !== 'undefined' ? `${window.location.origin}/logo.svg` : '/logo.svg'
        },
        permissions: {
            programIds: {
                [Network.AleoTestnet]: [
                    'credits.aleo',
                    CONTRACTS.BALANCE,
                    CONTRACTS.AUCTION,
                    CONTRACTS.BID,
                    CONTRACTS.CLAIM
                ]
            }
        }
    }), []);

    // Use Puzzle SDK hook for connection (recommended by docs)
    const { connect, loading: connectLoading, error: connectError } = useConnect(connectRequest);
    const { disconnect, loading: disconnectLoading } = useDisconnect();
    const { setWallet, resetWallet, setUserBalance } = useStore();

    // On mount: If account exists but we didn't explicitly connect, disconnect it
    // This ensures users must explicitly connect every time
    const autoDisconnectOnceRef = React.useRef(false);

    useEffect(() => {
        if (autoDisconnectOnceRef.current) return;
        if (account && !explicitlyConnected && isConnected && !isConnecting) {
            autoDisconnectOnceRef.current = true;
            console.log('Puzzle Wallet auto-connected - disconnecting to force manual connection...');
            disconnect().catch(() => {
                // Ignore errors, just clear local state
            });
        }
    }, [account, explicitlyConnected, isConnected, isConnecting, disconnect]);

    // Derived state - define before useRecords
    // Only consider connected if we explicitly connected AND account exists
    const connected = explicitlyConnected && !!account && !!isConnected;
    const address = (explicitlyConnected && account) ? account.address : null;
    const network = account?.network || 'testnet';
    const loading = connectLoading || disconnectLoading;

    // Only fetch records when connected - always call hook but with safe config
    // @ts-ignore - useRecords hook from Puzzle SDK
    const recordsResult = useRecords(
        connected && account?.address ? {
            filter: {
                programIds: [CONTRACTS.BALANCE],
                names: ['Balance'],
                status: 'Unspent'
            },
            network: Network.AleoTestnet
        } : {
            filter: {
                programIds: [],
                names: [],
                status: 'Unspent'
            },
            network: Network.AleoTestnet
        }
    );
    
    // Safely extract records and loading state
    const records = recordsResult?.records || [];
    const recordsLoading = recordsResult?.loading || false;
    const recordsLoadingActive = connected ? recordsLoading : false;

    const [balance, setBalance] = useState(0);

    // Calculate total balance from Balance records
    useEffect(() => {
        if (records && records.length > 0 && address) {
            // Filter to Balance records from the configured balance contract
            const balanceRecords = records.filter((r: any) => {
                const recordStr = typeof r === 'string' ? r : JSON.stringify(r);
                const isReceipt = recordStr.includes('DepositReceipt') || recordStr.includes('WithdrawReceipt');
                const isBalanceRecord = recordStr.includes('Balance');
                const isFromBalanceProgram = recordStr.includes(CONTRACTS.BALANCE);
                return !isReceipt && (isBalanceRecord || isFromBalanceProgram);
            });
            
            if (balanceRecords.length > 0) {
                const total = calculateTotalBalance(balanceRecords, '1field');
                setBalance(total);
                setUserBalance(total);
            } else {
                setBalance(0);
                setUserBalance(0);
            }
        } else if (address && !recordsLoading) {
            // No records found, balance is 0
            setBalance(0);
            setUserBalance(0);
        }
    }, [records, address, recordsLoading, setUserBalance]);

    // Sync with AleoWallet service for non-React components
    useEffect(() => {
        if (aleoWallet) {
            (aleoWallet as any).setAccount(address);
        }

        if (address) {
            setWallet({
                connected: true,
                address: address,
                network: (network === 'mainnet' ? 'mainnet' : 'testnet'),
            });
        } else {
            resetWallet();
            setBalance(0);
            setUserBalance(0);
        }
    }, [address, network, setWallet, resetWallet, setUserBalance]);

    // Wrapper for connect using Puzzle SDK hook
    // This will ALWAYS prompt for signature/permission like faucet.aleo.org
    const handleConnect = async () => {
        // Prevent multiple simultaneous connection attempts
        if (connectLoading) {
            console.log('Connection already in progress');
            return;
        }

        // Don't allow reconnecting if already connected - user must disconnect first
        // This ensures every connection requires explicit permission
        if (connected && account) {
            console.log('Already connected. Please disconnect first to reconnect.');
            const { addNotification } = useStore.getState();
            if (addNotification) {
                addNotification({
                    type: 'info',
                    title: 'Already Connected',
                    message: 'Wallet is already connected. Disconnect first to reconnect with fresh permissions.'
                });
            }
            return;
        }

        try {
            // Check if Puzzle wallet is available
            if (typeof window !== 'undefined') {
                const w = window as any;
                if (!w.puzzle && !w.puzzleWallet) {
                    const errorMsg = 'Puzzle Wallet not detected. Please install Puzzle Wallet extension from the Chrome Web Store.';
                    console.error(errorMsg);
                    alert(errorMsg);
                    return;
                }
            }

            // Mark intent to connect so auto-disconnect doesn't race
            setIsConnecting(true);

            // Use Puzzle SDK connect() to trigger wallet popup
            console.log('Requesting connection with signature...');
            console.log('Requesting permissions for programs:', connectRequest.permissions.programIds[Network.AleoTestnet]);

            const result = await connect();

            const connectedAddress =
                (result as any)?.account?.address ||
                (result as any)?.connection?.address ||
                account?.address;
            const connectedNetwork =
                (result as any)?.account?.network ||
                (result as any)?.connection?.network ||
                account?.network;

            // Require a signature on every connect
            const signatureMessage = `EquiClear connection approval\nAddress: ${connectedAddress}\nTime: ${new Date().toISOString()}`;
            await requestSignature({
                message: signatureMessage,
                address: connectedAddress,
                network: connectedNetwork as any,
            });

            // Mark as explicitly connected after signature succeeds
            setExplicitlyConnected(true);

            console.log('✅ Account connected:', connectedAddress);
            console.log('✅ Network:', connectedNetwork);
            console.log('✅ Contracts accessible:', connectRequest.permissions.programIds[Network.AleoTestnet]);
        } catch (e: any) {
            console.error("Connection failed", e);
            setExplicitlyConnected(false);
            setIsConnecting(false);
            disconnect().catch(() => {
                // ignore
            });
            
            // Show user-friendly error message
            let errorMessage = 'Failed to connect wallet. ';
            
            if (e?.message) {
                errorMessage += e.message;
            } else if (e?.toString) {
                errorMessage += e.toString();
            } else {
                errorMessage += 'Please ensure Puzzle Wallet is installed and unlocked.';
            }
            
            // Use notification system if available, otherwise alert
            const { addNotification } = useStore.getState();
            if (addNotification) {
                addNotification({
                    type: 'error',
                    title: 'Connection Failed',
                    message: errorMessage
                });
            } else {
                alert(errorMessage);
            }
        } finally {
            setIsConnecting(false);
        }
    };
    
    // Log connection state changes
    useEffect(() => {
        if (connectError) {
            console.error('Puzzle wallet connection error:', connectError);
        }
        if (account && explicitlyConnected) {
            console.log('Account connected:', account.address);
        }
    }, [connectError, account, explicitlyConnected]);

    const handleDisconnect = async () => {
        try {
            // Clear explicit connection flag FIRST
            setExplicitlyConnected(false);
            
            // Clear all local state
            resetWallet();
            setBalance(0);
            setUserBalance(0);
            
            // Disconnect from Puzzle SDK
            await disconnect();
            
            console.log('Wallet disconnected - next connection will require signature');
        } catch (e) {
            console.error("Disconnect failed", e);
            // Still clear local state even if SDK disconnect fails
            setExplicitlyConnected(false);
            resetWallet();
            setBalance(0);
            setUserBalance(0);
        }
    };
    
    // Watch for account changes - if account disappears, clear explicit connection
    useEffect(() => {
        if (!account && explicitlyConnected) {
            console.log('Account disconnected - clearing explicit connection flag');
            setExplicitlyConnected(false);
        }
    }, [account, explicitlyConnected]);

    return (
        <WalletContext.Provider
            value={{
                connected,
                address,
                balance: balance, // Real balance fetched from on-chain records
                network,
                loading: loading || recordsLoadingActive,
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
