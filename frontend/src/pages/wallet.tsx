'use client';
import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, ExternalLink } from 'lucide-react';
import { BalanceCard, DepositForm, WithdrawForm, DisconnectedState } from '@/components';
import { useStore } from '@/store';

export default function WalletPage() {
    const { wallet, transactions } = useStore();
    const [activeTab, setActiveTab] = React.useState<'deposit' | 'withdraw'>('deposit');

    if (!wallet.connected) {
        return (
            <>
                <Head>
                    <title>Wallet - EquiClear</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    <DisconnectedState
                        title="Connect Wallet to Manage Balance"
                        message="Connect your Puzzle or Leo wallet to deposit Aleo testnet tokens and start bidding in auctions"
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
                                Manage your internal balance for bidding
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
                    {/* Left Column - Balance & Forms */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Balance Card */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <BalanceCard />
                        </div>

                        {/* Tab Navigation */}
                        <div
                            className="flex gap-sm"
                            style={{ marginBottom: 'var(--space-lg)' }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab('deposit')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <ArrowDownToLine size={18} />
                                Deposit
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`btn ${activeTab === 'withdraw' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab('withdraw')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <ArrowUpFromLine size={18} />
                                Withdraw
                            </motion.button>
                        </div>

                        {/* Form */}
                        {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
                    </div>

                    {/* Right Column - Transaction History */}
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

                            {!wallet.connected ? (
                                <div className="text-center" style={{ padding: 'var(--space-xl)' }}>
                                    <p className="text-muted">Connect wallet to view transactions</p>
                                </div>
                            ) : transactions.length === 0 ? (
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

                            {wallet.connected && transactions.length > 0 && (
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

                        {/* Info Cards */}
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
                                    Deposit tokens to your internal balance
                                </li>
                                <li style={{ marginBottom: 'var(--space-sm)' }}>
                                    Use internal balance to place private bids
                                </li>
                                <li style={{ marginBottom: 'var(--space-sm)' }}>
                                    Withdraw unused tokens anytime
                                </li>
                                <li>
                                    All transactions use ZK proofs for privacy
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}

function TransactionItem({ transaction, index }: { transaction: any; index: number }) {
    const getTypeStyles = () => {
        switch (transaction.type) {
            case 'deposit':
            case 'refund':
                return { color: 'var(--color-success)', prefix: '+' };
            case 'withdraw':
            case 'bid':
                return { color: 'var(--color-error)', prefix: '' };
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

