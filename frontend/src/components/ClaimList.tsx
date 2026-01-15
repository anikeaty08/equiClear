'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Loader2, CheckCircle, XCircle, Gift } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';
import { Claim } from '@/services/api';

interface ClaimListProps {
    claims: Claim[];
    loading?: boolean;
    onRefresh?: () => void;
}

export default function ClaimList({ claims, loading = false, onRefresh }: ClaimListProps) {
    if (loading) {
        return (
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                <div className="flex items-center justify-center gap-md" style={{ padding: 'var(--space-2xl)' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Loading claims...</span>
                </div>
                <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    if (claims.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{
                    padding: 'var(--space-3xl)',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-lg)',
                    }}
                >
                    <Gift size={40} className="text-secondary" />
                </div>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Claims Available</h3>
                <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
                    Win auctions to see your claims here. Start bidding now!
                </p>
                <motion.a
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex' }}
                >
                    Browse Auctions
                </motion.a>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1" style={{ gap: 'var(--space-lg)' }}>
            {claims.map((claim, index) => (
                <ClaimItem key={claim.id} claim={claim} index={index} onSuccess={onRefresh} />
            ))}
        </div>
    );
}

interface ClaimItemProps {
    claim: Claim;
    index: number;
    onSuccess?: () => void;
}

function ClaimItem({ claim, index, onSuccess }: ClaimItemProps) {
    const { addNotification, setUserBalance, userBalance } = useStore();
    const [isClaiming, setIsClaiming] = React.useState(false);

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const result = await aleoWallet.claimItems(claim.auction_id);

            if (result.success) {
                // Add refund to balance
                if (claim.refund_amount > 0) {
                    setUserBalance(userBalance + claim.refund_amount);
                }

                addNotification({
                    type: 'success',
                    title: 'Claim Successful!',
                    message: `Claimed ${claim.items_claimed} item(s)${claim.refund_amount > 0 ? ` and ${claim.refund_amount.toLocaleString()} credits refund` : ''}.`,
                });
                onSuccess?.();
            } else {
                throw new Error(result.error || 'Claim failed');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Claim Failed',
                message: error.message || 'Failed to claim. Please try again.',
            });
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card"
            style={{ padding: 'var(--space-xl)' }}
        >
            <div className="flex justify-between items-start" style={{ gap: 'var(--space-lg)' }}>
                {/* Left - Icon & Info */}
                <div className="flex items-center gap-lg" style={{ flex: 1 }}>
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Trophy size={28} className="text-secondary" />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 var(--space-xs) 0' }}>
                            Auction #{claim.auction_id.slice(0, 8)}
                        </h4>
                        <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                            Won {claim.items_claimed} item(s)
                        </p>
                    </div>
                </div>

                {/* Middle - Stats */}
                <div className="flex gap-xl" style={{ flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span className="text-muted" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 'var(--space-xs)'
                        }}>
                            Amount Paid
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                            {claim.amount_paid.toLocaleString()}
                        </span>
                    </div>
                    {claim.refund_amount > 0 && (
                        <div style={{ textAlign: 'center' }}>
                            <span className="text-muted" style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 'var(--space-xs)'
                            }}>
                                Refund
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                                +{claim.refund_amount.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right - Claim Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={handleClaim}
                    disabled={isClaiming}
                    style={{ flexShrink: 0 }}
                >
                    {isClaiming ? (
                        <>
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            Claiming...
                        </>
                    ) : (
                        <>
                            <CheckCircle size={18} />
                            Claim
                        </>
                    )}
                </motion.button>
            </div>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </motion.div>
    );
}
