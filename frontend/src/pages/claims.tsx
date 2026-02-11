'use client';

import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { DisconnectedState } from '@/components';
import { aleoWallet } from '@/services/wallet';
import { useStore } from '@/store';
import { Loader2, Receipt } from 'lucide-react';

export default function ClaimsPage() {
    const { connected, bidReceipts } = useWallet();
    const { addNotification } = useStore();
    const [redeemingId, setRedeemingId] = React.useState<string | null>(null);

    if (!connected) {
        return (
            <>
                <Head>
                    <title>EquiClear - Redeem Bids</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    <DisconnectedState
                        title="Connect to View Bids"
                        message="Connect your wallet to see your bid receipts and redeem winning bids."
                        showFeatures={false}
                    />
                </div>
            </>
        );
    }

    const handleRedeem = async (receipt: any, index: number) => {
        setRedeemingId(String(index));
        try {
            // For now use public redemption - auctioneer address would come from on-chain
            const result = await aleoWallet.redeemBidPublic(
                receipt.auctioneer || receipt.owner,
                receipt
            );
            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Bid Redeemed!',
                    message: 'Your winning bid has been redeemed. Credits transferred to the auctioneer.',
                });
            } else {
                throw new Error(result.error || 'Redemption failed');
            }
        } catch (err: any) {
            addNotification({
                type: 'error',
                title: 'Redemption Failed',
                message: err?.message || 'Failed to redeem bid. The auction may not be settled yet.',
            });
        } finally {
            setRedeemingId(null);
        }
    };

    return (
        <>
            <Head>
                <title>EquiClear - Redeem Bids</title>
            </Head>
            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--space-xl)' }}
                >
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>Redeem Bids</h1>
                    <p className="text-secondary">
                        Redeem your winning bid receipts after an auction settles. Credits transfer atomically to the auctioneer.
                    </p>
                </motion.div>

                {bidReceipts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card"
                        style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}
                    >
                        <Receipt size={48} className="text-muted" style={{ marginBottom: 'var(--space-lg)' }} />
                        <p className="text-secondary">No bid receipts yet. Place bids on auctions to see them here.</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                    {bidReceipts.map((receipt: any, i: number) => (
                        <motion.div
                            key={i}
                            className="glass-card"
                            whileHover={{ y: -4 }}
                            style={{
                                padding: 'var(--space-lg)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>
                                Bid Receipt #{i + 1}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                                Redeem this receipt after the auction settles to complete payment.
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-primary"
                                onClick={() => handleRedeem(receipt, i)}
                                disabled={redeemingId === String(i)}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {redeemingId === String(i) ? (
                                    <>
                                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                        Redeeming...
                                    </>
                                ) : (
                                    'Redeem Bid'
                                )}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
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
