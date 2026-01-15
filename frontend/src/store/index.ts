// EquiClear Global State Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Auction, Claim } from '@/services/api';

interface WalletState {
    connected: boolean;
    address: string | null;
    balance: number;
    network: 'testnet' | 'mainnet';
}

interface AppState {
    // Wallet
    wallet: WalletState;
    setWallet: (wallet: Partial<WalletState>) => void;
    resetWallet: () => void;

    // Auctions
    auctions: Auction[];
    setAuctions: (auctions: Auction[]) => void;
    selectedAuction: Auction | null;
    setSelectedAuction: (auction: Auction | null) => void;

    // User Data
    userClaims: Claim[];
    setUserClaims: (claims: Claim[]) => void;
    userBalance: number;
    setUserBalance: (balance: number) => void;

    // UI State
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
}

const initialWalletState: WalletState = {
    connected: false,
    address: null,
    balance: 0,
    network: 'testnet',
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Wallet
            wallet: initialWalletState,
            setWallet: (wallet) =>
                set((state) => ({
                    wallet: { ...state.wallet, ...wallet },
                })),
            resetWallet: () => set({ wallet: initialWalletState }),

            // Auctions
            auctions: [],
            setAuctions: (auctions) => set({ auctions }),
            selectedAuction: null,
            setSelectedAuction: (auction) => set({ selectedAuction: auction }),

            // User Data
            userClaims: [],
            setUserClaims: (claims) => set({ userClaims: claims }),
            userBalance: 0,
            setUserBalance: (balance) => set({ userBalance: balance }),

            // UI State
            isLoading: false,
            setLoading: (loading) => set({ isLoading: loading }),
            notifications: [],
            addNotification: (notification) => {
                const id = Math.random().toString(36).substring(7);
                set((state) => ({
                    notifications: [...state.notifications, { ...notification, id }],
                }));
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    get().removeNotification(id);
                }, 5000);
            },
            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),
        }),
        {
            name: 'equiclear-storage',
            partialize: (state) => ({
                wallet: state.wallet,
            }),
        }
    )
);

export default useStore;
