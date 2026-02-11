'use client';
import React from 'react';
import { motion } from 'framer-motion';
import AuctionCard from './AuctionCard';
import { Auction } from '@/services/aleo';

interface AuctionGridProps {
    auctions: Auction[];
    loading?: boolean;
}

export default function AuctionGrid({ auctions, loading = false }: AuctionGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (auctions.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{
                    padding: 'var(--space-3xl)',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🔍</div>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Auctions Found</h3>
                <p className="text-secondary">
                    There are no auctions matching your criteria. Check back later or create your own!
                </p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
            {auctions.map((auction, index) => (
                <AuctionCard key={auction.auction_id} auction={auction} index={index} />
            ))}
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
            <div className="flex justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="skeleton" style={{ width: '60px', height: '24px' }} />
                <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </div>
            <div className="skeleton" style={{ width: '70%', height: '28px', marginBottom: 'var(--space-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px', marginBottom: 'var(--space-lg)' }} />
            <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: 'var(--space-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', marginBottom: 'var(--space-lg)' }} />
            <div className="skeleton" style={{ width: '100%', height: '8px', marginBottom: 'var(--space-lg)' }} />
            <div className="flex justify-between" style={{ paddingTop: 'var(--space-md)' }}>
                <div className="skeleton" style={{ width: '100px', height: '20px' }} />
                <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            </div>
        </div>
    );
}
