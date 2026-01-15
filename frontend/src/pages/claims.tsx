'use client';
import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Trophy, Gift, RefreshCw, Filter } from 'lucide-react';
import { ClaimList } from '@/components';
import { useStore } from '@/store';
import { api, Claim } from '@/services/api';

export default function ClaimsPage() {
    const { wallet, addNotification } = useStore();
    const [claims, setClaims] = React.useState<Claim[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'pending' | 'claimed'>('all');

    React.useEffect(() => {
        if (wallet.connected && wallet.address) {
            loadClaims();
        } else {
            setLoading(false);
        }
    }, [wallet.connected, wallet.address]);

    const loadClaims = async () => {
        if (!wallet.address) return;

        setLoading(true);
        try {
            const data = await api.getUserClaims(wallet.address);
            setClaims(data);
        } catch (error) {
            console.error('Failed to load claims:', error);
            // Demo data
            setClaims(getDemoClaims());
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        addNotification({
            type: 'info',
            title: 'Refreshing...',
            message: 'Fetching latest claim data.',
        });
        loadClaims();
    };

    const stats = {
        totalWon: claims.reduce((sum, c) => sum + c.items_claimed, 0),
        totalPaid: claims.reduce((sum, c) => sum + c.amount_paid, 0),
        totalRefunds: claims.reduce((sum, c) => sum + c.refund_amount, 0),
    };

    return (
        <>
            <Head>
                <title>Claims - EquiClear</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-start"
                    style={{ marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', gap: 'var(--space-lg)' }}
                >
                    <div className="flex items-center gap-lg">
                        <div
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--color-success), #059669)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Trophy size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0 }}>Your Claims</h1>
                            <p className="text-secondary" style={{ margin: 0 }}>
                                Claim your won items and refunds
                            </p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-secondary"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </motion.button>
                </motion.div>

                {/* Stats Cards */}
                {wallet.connected && claims.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-3"
                        style={{ gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}
                    >
                        <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                Items Won
                            </div>
                            <div className="price-display" style={{ fontSize: '2rem' }}>{stats.totalWon}</div>
                        </div>
                        <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                Total Paid
                            </div>
                            <div className="price-display" style={{ fontSize: '2rem' }}>{stats.totalPaid.toLocaleString()}</div>
                        </div>
                        <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                Refunds
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                                +{stats.totalRefunds.toLocaleString()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Not Connected State */}
                {!wallet.connected ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}
                    >
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(245, 158, 11, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-lg)',
                            }}
                        >
                            <Gift size={40} style={{ color: 'var(--color-warning)' }} />
                        </div>
                        <h2>Connect Your Wallet</h2>
                        <p className="text-secondary" style={{ maxWidth: '400px', margin: '0 auto' }}>
                            Connect your Aleo wallet to view and claim your auction wins and refunds.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Filter Tabs */}
                        <div className="flex gap-sm" style={{ marginBottom: 'var(--space-xl)' }}>
                            {(['all', 'pending', 'claimed'] as const).map((f) => (
                                <motion.button
                                    key={f}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-lg)',
                                        fontSize: '0.875rem',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {f}
                                </motion.button>
                            ))}
                        </div>

                        {/* Claims List */}
                        <ClaimList claims={claims} loading={loading} onRefresh={loadClaims} />
                    </>
                )}
            </div>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}

function getDemoClaims(): Claim[] {
    return [
        {
            id: '1',
            auction_id: 'demo001abc',
            user_address: 'aleo1demo...',
            items_claimed: 5,
            amount_paid: 6000,
            refund_amount: 4000,
            claimed_at: new Date().toISOString(),
        },
        {
            id: '2',
            auction_id: 'demo003ghi',
            user_address: 'aleo1demo...',
            items_claimed: 10,
            amount_paid: 12000,
            refund_amount: 0,
            claimed_at: new Date(Date.now() - 86400000).toISOString(),
        },
    ];
}
