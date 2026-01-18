'use client';

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingDown, ArrowLeft, ExternalLink } from 'lucide-react';
import { BidForm, DisconnectedState } from '@/components';
import { useStore } from '@/store';
import api from '@/services/api';
import { Auction } from '@/services/api';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

export default function AuctionDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { wallet } = useStore();
    const [auction, setAuction] = React.useState<Auction | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentPrice, setCurrentPrice] = React.useState(0);

    React.useEffect(() => {
        if (!id) return;

        const loadAuction = async () => {
            setLoading(true);
            try {
                const data = await api.getAuction(id as string);
                setAuction(data);
                setCurrentPrice(data.start_price);
            } catch (error) {
                console.error('Failed to load auction', error);
            } finally {
                setLoading(false);
            }
        };

        loadAuction();
    }, [id]);

    // Calculate Dutch auction price decay
    React.useEffect(() => {
        if (!auction || auction.status !== 1) return;

        const startTime = new Date(auction.start_time);
        const endTime = new Date(auction.end_time);

        const updatePrice = () => {
            const now = new Date();
            const totalDuration = differenceInSeconds(endTime, startTime);
            const elapsed = differenceInSeconds(now, startTime);

            if (elapsed <= 0) {
                setCurrentPrice(auction.start_price);
            } else if (elapsed >= totalDuration) {
                setCurrentPrice(auction.reserve_price);
            } else {
                const priceDrop = auction.start_price - auction.reserve_price;
                const decay = (elapsed / totalDuration) * priceDrop;
                setCurrentPrice(Math.round(auction.start_price - decay));
            }
        };

        updatePrice();
        const interval = setInterval(updatePrice, 1000);
        return () => clearInterval(interval);
    }, [auction]);

    if (loading) {
        return (
            <>
                <Head>
                    <title>Loading Auction - EquiClear</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)' }}>
                    <div className="glass-card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
                        <div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto var(--space-lg)' }} />
                        <div className="skeleton" style={{ width: '100%', height: '400px', margin: '0 auto' }} />
                    </div>
                </div>
            </>
        );
    }

    if (!auction) {
        return (
            <>
                <Head>
                    <title>Auction Not Found - EquiClear</title>
                </Head>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card"
                        style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}
                    >
                        <h2 style={{ marginBottom: 'var(--space-md)' }}>Auction Not Found</h2>
                        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
                            The auction you're looking for doesn't exist or has been removed.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary"
                            onClick={() => router.push('/')}
                        >
                            <ArrowLeft size={20} />
                            Back to Auctions
                        </motion.button>
                    </motion.div>
                </div>
            </>
        );
    }

    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    const now = new Date();
    const isActive = auction.status === 1;
    const isSettled = auction.status === 2;
    const progressPercent = isActive
        ? Math.min(100, (differenceInSeconds(now, startTime) / differenceInSeconds(endTime, startTime)) * 100)
        : 0;

    const displayPrice = isSettled && auction.clearing_price ? auction.clearing_price : currentPrice;

    return (
        <>
            <Head>
                <title>{auction.item_name || 'Auction'} - EquiClear</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    className="btn btn-secondary"
                    onClick={() => router.push('/')}
                    style={{ marginBottom: 'var(--space-xl)' }}
                >
                    <ArrowLeft size={18} />
                    Back to Auctions
                </motion.button>

                <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
                    {/* Left Column - Auction Details */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-lg)' }}>
                                <div>
                                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-sm)' }}>
                                        {isActive && <span className="badge badge-live">● Live</span>}
                                        {isSettled && <span className="badge badge-settled">Settled</span>}
                                        {auction.status === 0 && <span className="badge badge-upcoming">Upcoming</span>}
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: '2rem' }}>
                                        {auction.item_name || `Auction #${auction.auction_id.slice(0, 8)}`}
                                    </h1>
                                </div>
                            </div>

                            {/* Description */}
                            {auction.item_description && (
                                <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', fontSize: '1rem' }}>
                                    {auction.item_description}
                                </p>
                            )}

                            {/* Price Display */}
                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <span className="text-muted" style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}>
                                        {isActive ? 'Current Price' : isSettled ? 'Final Clearing Price' : 'Starting Price'}
                                    </span>
                                    <TrendingDown size={20} className="text-secondary" />
                                </div>
                                <div className="price-display" style={{ fontSize: '3rem' }}>
                                    {displayPrice.toLocaleString()}
                                    <span style={{ fontSize: '1.5rem', opacity: 0.7, marginLeft: 'var(--space-sm)' }}>
                                        credits
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {isActive && (
                                <div style={{ marginBottom: 'var(--space-xl)' }}>
                                    <div className="progress-bar" style={{ height: '8px' }}>
                                        <motion.div
                                            className="progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-muted" style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                        <span>Start: {auction.start_price.toLocaleString()} credits</span>
                                        <span>Reserve: {auction.reserve_price.toLocaleString()} credits</span>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                                <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                                    <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                                        <Users size={18} className="text-secondary" />
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>Supply</span>
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                        {auction.remaining_supply} / {auction.total_supply} remaining
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                                    <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                                        <Clock size={18} className="text-secondary" />
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                            {isActive ? 'Time Remaining' : isSettled ? 'Ended' : 'Starts In'}
                                        </span>
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                        {isActive
                                            ? formatDistanceToNow(endTime, { addSuffix: false })
                                            : isSettled
                                            ? formatDistanceToNow(endTime, { addSuffix: true })
                                            : formatDistanceToNow(startTime, { addSuffix: false })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Bid Form */}
                    <div>
                        {!wallet.connected ? (
                            <DisconnectedState
                                title="Connect to Bid"
                                message="Connect your wallet to place a bid on this auction"
                                showFeatures={false}
                            />
                        ) : (
                            <BidForm
                                auctionId={auction.auction_id}
                                currentPrice={displayPrice}
                                remainingSupply={auction.remaining_supply}
                                onSuccess={() => {
                                    // Refresh auction data
                                    api.getAuction(auction.auction_id).then(setAuction);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
