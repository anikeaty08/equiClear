'use client';

import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import api, { Claim } from '@/services/api';
import { DisconnectedState } from '@/components';

export default function ClaimsPage() {
    const { connected, address } = useWallet();
    const [claims, setClaims] = React.useState<Claim[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        const loadClaims = async () => {
            if (!connected || !address) return;
            setLoading(true);
            setError(null);
            try {
                const data = await api.getUserClaims(address);
                if (!cancelled) setClaims(data);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Failed to load claims');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadClaims();
        return () => {
            cancelled = true;
        };
    }, [connected, address]);

    if (!connected) {
        return (
            <>
                <Head>
                    <title>EquiClear - Claims</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    <DisconnectedState
                        title="Connect to View Claims"
                        message="Connect your wallet to see completed auctions, payouts, and refunds."
                        showFeatures={false}
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>EquiClear - Claims</title>
            </Head>
            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--space-xl)' }}
                >
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>Your Claims</h1>
                    <p className="text-secondary">
                        Review finalized auctions and refunds linked to your wallet.
                    </p>
                </motion.div>

                {loading && <p className="text-secondary">Loading claims...</p>}
                {error && <p className="text-secondary">{error}</p>}

                {!loading && !error && claims.length === 0 && (
                    <p className="text-secondary">No claims yet.</p>
                )}

                <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                    {claims.map((claim) => (
                        <motion.div
                            key={claim.id}
                            className="glass-card"
                            whileHover={{ y: -4 }}
                            style={{
                                padding: 'var(--space-lg)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                                Auction: {claim.auction_id}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
                                Items claimed: {claim.items_claimed}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
                                Amount paid: {claim.amount_paid}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
                                Refund: {claim.refund_amount}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </>
    );
}
