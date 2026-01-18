'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';

interface BalanceCardProps {
    tokenId?: string;
    tokenName?: string;
}

export default function BalanceCard({ tokenId = '1', tokenName = 'ALEO' }: BalanceCardProps) {
    const { wallet, userBalance } = useStore();
    const [showBalance, setShowBalance] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Trigger a re-fetch by reloading the page or refreshing wallet connection
        // The WalletContext will automatically fetch latest records
        window.location.reload();
        setIsRefreshing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card glow-effect"
            style={{
                padding: 'var(--space-xl)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(34, 211, 238, 0.05))',
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex items-center gap-md">
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Wallet size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Internal Balance</h3>
                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>{tokenName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-sm">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowBalance(!showBalance)}
                        className="btn btn-secondary"
                        style={{ padding: 'var(--space-sm)', minWidth: 'auto' }}
                    >
                        {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        className="btn btn-secondary"
                        style={{ padding: 'var(--space-sm)', minWidth: 'auto' }}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            size={18}
                            style={{
                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                            }}
                        />
                    </motion.button>
                </div>
            </div>

            {/* Balance Display */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <span className="text-muted" style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--space-xs)'
                }}>
                    Available Balance
                </span>
                <div className="price-display" style={{ fontSize: '2.5rem' }}>
                    {showBalance ? (
                        <>
                            {userBalance.toLocaleString()}
                            <span style={{ fontSize: '1rem', opacity: 0.6, marginLeft: 'var(--space-sm)' }}>
                                credits
                            </span>
                        </>
                    ) : (
                        '••••••'
                    )}
                </div>
            </div>

            {/* Wallet Status */}
            {wallet.connected ? (
                <div
                    className="flex items-center gap-sm"
                    style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    <span className="text-secondary">
                        Connected: {wallet.address?.slice(0, 12)}...{wallet.address?.slice(-6)}
                    </span>
                </div>
            ) : (
                <div
                    className="flex items-center gap-sm"
                    style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                    }}
                >
                    <span className="text-warning">Connect wallet to view balance</span>
                </div>
            )}

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </motion.div>
    );
}
