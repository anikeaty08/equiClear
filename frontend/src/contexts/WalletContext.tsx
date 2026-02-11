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
import aleoWallet from '@/services/wallet';
import { useStore } from '@/store';
import { CONTRACTS } from '@/services/aleo';
import { RecordStatus } from '@puzzlehq/types';

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
    auctionTickets: any[];
    bidReceipts: any[];
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

    const [explicitlyConnected, setExplicitlyConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

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
                    CONTRACTS.AUCTION,
                ]
            }
        }
    }), []);

    const { connect, loading: connectLoading, error: connectError } = useConnect(connectRequest);
    const { disconnect, loading: disconnectLoading } = useDisconnect();
    const { setWallet, resetWallet, setUserBalance } = useStore();

    const autoDisconnectOnceRef = React.useRef(false);

    useEffect(() => {
        if (autoDisconnectOnceRef.current) return;
        if (account && !explicitlyConnected && isConnected && !isConnecting) {
            autoDisconnectOnceRef.current = true;
            console.log('Puzzle Wallet auto-connected - disconnecting to force manual connection...');
            disconnect().catch(() => {});
        }
    }, [account, explicitlyConnected, isConnected, isConnecting, disconnect]);

    const connected = explicitlyConnected && !!account && !!isConnected;
    const address = (explicitlyConnected && account) ? account.address : null;
    const network = account?.network || 'testnet';
    const loading = connectLoading || disconnectLoading;

    // Fetch AuctionTicket records
    // @ts-ignore
    const ticketRecordsResult = useRecords(
        connected && account?.address ? {
            filter: {
                programIds: [CONTRACTS.AUCTION],
                names: ['AuctionTicket'],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        } : {
            filter: {
                programIds: [],
                names: [],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        }
    );

    // Fetch BidReceipt records
    // @ts-ignore
    const bidRecordsResult = useRecords(
        connected && account?.address ? {
            filter: {
                programIds: [CONTRACTS.AUCTION],
                names: ['BidReceipt'],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        } : {
            filter: {
                programIds: [],
                names: [],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        }
    );

    const auctionTickets = ticketRecordsResult?.records || [];
    const bidReceipts = bidRecordsResult?.records || [];
    const recordsLoading = (ticketRecordsResult?.loading || false) || (bidRecordsResult?.loading || false);
    const recordsLoadingActive = connected ? recordsLoading : false;

    const [balance, setBalance] = useState(0);

    // Sync with AleoWallet service for non-React components
    useEffect(() => {
        try {
            if (aleoWallet && aleoWallet.isInitialized && aleoWallet.isInitialized() && aleoWallet.setAccount) {
                aleoWallet.setAccount(address);
            }
        } catch (e) {
            console.debug('AleoWallet sync skipped:', e);
        }

        if (address) {
            setWallet({
                connected: true,
                address: address,
                network: 'testnet',
            });
        } else {
            resetWallet();
            setBalance(0);
            setUserBalance(0);
        }
    }, [address, network, setWallet, resetWallet, setUserBalance]);

    const handleConnect = async () => {
        if (connectLoading) {
            console.log('Connection already in progress');
            return;
        }

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
            if (typeof window !== 'undefined') {
                const w = window as any;
                if (!w.puzzle && !w.puzzleWallet) {
                    const errorMsg = 'Puzzle Wallet not detected. Please install Puzzle Wallet extension from the Chrome Web Store.';
                    console.error(errorMsg);
                    alert(errorMsg);
                    return;
                }
            }

            setIsConnecting(true);

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

            const signatureMessage = `EquiClear connection approval\nAddress: ${connectedAddress}\nTime: ${new Date().toISOString()}`;
            await requestSignature({
                message: signatureMessage,
                address: connectedAddress,
                network: connectedNetwork as any,
            });

            setExplicitlyConnected(true);

            console.log('Account connected:', connectedAddress);
            console.log('Network:', connectedNetwork);
        } catch (e: any) {
            console.error("Connection failed", e);
            setExplicitlyConnected(false);
            setIsConnecting(false);
            disconnect().catch(() => {});

            let errorMessage = 'Failed to connect wallet. ';

            if (e?.message) {
                errorMessage += e.message;
            } else if (e?.toString) {
                errorMessage += e.toString();
            } else {
                errorMessage += 'Please ensure Puzzle Wallet is installed and unlocked.';
            }

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
            setExplicitlyConnected(false);
            resetWallet();
            setBalance(0);
            setUserBalance(0);
            await disconnect();
            console.log('Wallet disconnected - next connection will require signature');
        } catch (e) {
            console.error("Disconnect failed", e);
            setExplicitlyConnected(false);
            resetWallet();
            setBalance(0);
            setUserBalance(0);
        }
    };

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
                balance,
                network,
                loading: loading || recordsLoadingActive,
                providerType: 'puzzle',
                connect: handleConnect,
                disconnect: handleDisconnect,
                auctionTickets,
                bidReceipts,
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
