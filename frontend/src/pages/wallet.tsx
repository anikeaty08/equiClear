'use client';
import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Wallet, History, ExternalLink, Receipt, Ticket } from 'lucide-react';
import { DisconnectedState } from '@/components';
import { useStore } from '@/store';
import { useWallet } from '@/contexts/WalletContext';

export default function WalletPage() {
    const { wallet, transactions } = useStore();
    const { auctionTickets, bidReceipts } = useWallet();

    if (!wallet.connected) {
        return (
            <>
                <Head>
                    <title>Wallet - EquiClear</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    <DisconnectedState
                        title="Connect Wallet to View Records"
                        message="Connect your Puzzle or Leo wallet to view your auction tickets, bid receipts, and transaction history"
                        showFeatures={true}
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Wallet - EquiClear</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="page-header"
                    style={{ textAlign: 'left', paddingBottom: 'var(--space-xl)' }}
                >
                    <div className="flex items-center gap-lg" style={{ marginBottom: 'var(--space-md)' }}>
                        <div
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Wallet size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0 }}>Wallet</h1>
                            <p className="text-secondary" style={{ margin: 0 }}>
                                Your auction tickets, bids, and transaction history
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
                    {/* Left Column - Records */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Connected Status Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card glow-effect"
                            style={{
                                padding: 'var(--space-xl)',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(34, 211, 238, 0.05))',
                                marginBottom: 'var(--space-xl)',
                            }}
                        >
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
                        </motion.div>

                        {/* Auction Tickets */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}
                        >
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                                <Ticket size={20} className="text-secondary" />
                                <h3 style={{ margin: 0 }}>Your Auction Tickets</h3>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    ({auctionTickets.length})
                                </span>
                            </div>
                            {auctionTickets.length === 0 ? (
                                <p className="text-muted" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                    No auction tickets yet. Create an auction to get started.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {auctionTickets.map((ticket: any, i: number) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: 'var(--space-md)',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                fontSize: '0.85rem',
                                            }}
                                            className="text-secondary"
                                        >
                                            Auction Ticket #{i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Bid Receipts */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)' }}
                        >
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                                <Receipt size={20} className="text-secondary" />
                                <h3 style={{ margin: 0 }}>Your Bid Receipts</h3>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    ({bidReceipts.length})
                                </span>
                            </div>
                            {bidReceipts.length === 0 ? (
                                <p className="text-muted" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                    No bid receipts yet. Place a bid on an auction to get started.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {bidReceipts.map((receipt: any, i: number) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: 'var(--space-md)',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                fontSize: '0.85rem',
                                            }}
                                            className="text-secondary"
                                        >
                                            Bid Receipt #{i + 1}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Column - Transaction History & Info */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)' }}
                        >
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                                <History size={20} className="text-secondary" />
                                <h3 style={{ margin: 0 }}>Recent Transactions</h3>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center" style={{ padding: 'var(--space-xl)' }}>
                                    <p className="text-muted">No transactions yet</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {transactions.map((tx, i) => (
                                        <TransactionItem key={tx.id} transaction={tx} index={i} />
                                    ))}
                                </div>
                            )}

                            {transactions.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginTop: 'var(--space-lg)', justifyContent: 'center' }}
                                >
                                    View All Transactions
                                    <ExternalLink size={16} />
                                </motion.button>
                            )}
                        </motion.div>

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}
                        >
                            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.95rem' }}>How It Works</h4>
                            <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', fontSize: '0.85rem' }} className="text-secondary">
                                <li style={{ marginBottom: 'var(--space-sm)' }}>
                                    No deposits needed - bid directly on auctions
                                </li>
                                <li style={{ marginBottom: 'var(--space-sm)' }}>
                                    Bids are private commitments using ZK proofs
                                </li>
                                <li style={{ marginBottom: 'var(--space-sm)' }}>
                                    Winners pay at redemption via atomic credits transfer
                                </li>
                                <li>
                                    No custody risk - credits stay in your wallet until settlement
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}

function TransactionItem({ transaction, index }: { transaction: any; index: number }) {
    const getTypeStyles = () => {
        switch (transaction.type) {
            case 'bid':
                return { color: 'var(--color-primary)', prefix: '' };
            case 'redeem':
                return { color: 'var(--color-success)', prefix: '-' };
            case 'claim':
                return { color: 'var(--color-secondary)', prefix: '' };
            default:
                return { color: 'var(--text-primary)', prefix: '' };
        }
    };

    const styles = getTypeStyles();

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
            }}
        >
            <div className="flex justify-between items-center">
                <div>
                    <span style={{
                        fontSize: '0.8rem',
                        textTransform: 'capitalize',
                        color: styles.color,
                        fontWeight: 600,
                    }}>
                        {transaction.type}
                    </span>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: styles.color, fontWeight: 700 }}>
                        {styles.prefix}{Math.abs(transaction.amount).toLocaleString()}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {transaction.status}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
