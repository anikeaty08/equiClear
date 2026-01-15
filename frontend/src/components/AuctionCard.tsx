'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingDown, ArrowRight } from 'lucide-react';
import { Auction } from '@/services/api';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface AuctionCardProps {
    auction: Auction;
    index?: number;
}

export default function AuctionCard({ auction, index = 0 }: AuctionCardProps) {
    const [currentPrice, setCurrentPrice] = React.useState(auction.start_price);
    const [timeRemaining, setTimeRemaining] = React.useState('');

    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    const now = new Date();

    const isActive = auction.status === 1;
    const isUpcoming = auction.status === 0;
    const isSettled = auction.status === 2;

    // Calculate Dutch auction price decay
    React.useEffect(() => {
        if (!isActive) return;

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
    }, [auction, isActive, startTime, endTime]);

    // Update time remaining
    React.useEffect(() => {
        const update = () => {
            if (isActive) {
                setTimeRemaining(formatDistanceToNow(endTime, { addSuffix: false }));
            } else if (isUpcoming) {
                setTimeRemaining(formatDistanceToNow(startTime, { addSuffix: false }));
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [isActive, isUpcoming, startTime, endTime]);

    const progressPercent = isActive
        ? Math.min(100, (differenceInSeconds(now, startTime) / differenceInSeconds(endTime, startTime)) * 100)
        : 0;

    const getStatusBadge = () => {
        if (isActive) return <span className="badge badge-live">● Live</span>;
        if (isUpcoming) return <span className="badge badge-upcoming">Upcoming</span>;
        if (isSettled) return <span className="badge badge-settled">Settled</span>;
        return <span className="badge">Cancelled</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="card-3d"
        >
            <Link href={`/auction/${auction.auction_id}`}>
                <div className="glass-card glow-effect" style={{ padding: 'var(--space-xl)', cursor: 'pointer' }}>
                    <div className="card-3d-inner">
                        {/* Header */}
                        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                            {getStatusBadge()}
                            <div className="flex items-center gap-sm text-muted" style={{ fontSize: '0.875rem' }}>
                                <Clock size={14} />
                                <span>{timeRemaining}</span>
                            </div>
                        </div>

                        {/* Item Name */}
                        <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.25rem' }}>
                            {auction.item_name || `Auction #${auction.auction_id.slice(0, 8)}`}
                        </h3>

                        {/* Description */}
                        <p className="text-secondary" style={{
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.9rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {auction.item_description || 'Dutch auction with uniform clearing price'}
                        </p>

                        {/* Price Display */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xs)' }}>
                                <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    {isActive ? 'Current Price' : isSettled ? 'Final Price' : 'Starting Price'}
                                </span>
                                <TrendingDown size={16} className="text-secondary" />
                            </div>
                            <div className="price-display" style={{ fontSize: '1.75rem' }}>
                                {isSettled && auction.clearing_price
                                    ? auction.clearing_price.toLocaleString()
                                    : currentPrice.toLocaleString()
                                } <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>credits</span>
                            </div>
                        </div>

                        {/* Progress Bar (for active auctions) */}
                        {isActive && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <div className="progress-bar">
                                    <motion.div
                                        className="progress-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-muted" style={{ marginTop: 'var(--space-xs)', fontSize: '0.75rem' }}>
                                    <span>{auction.start_price.toLocaleString()}</span>
                                    <span>{auction.reserve_price.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex justify-between items-center" style={{
                            padding: 'var(--space-md) 0',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <div className="flex items-center gap-sm">
                                <Users size={16} className="text-secondary" />
                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                    {auction.total_supply - auction.remaining_supply} / {auction.total_supply} sold
                                </span>
                            </div>
                            <motion.div
                                whileHover={{ x: 5 }}
                                className="flex items-center gap-sm text-secondary"
                                style={{ fontSize: '0.875rem', fontWeight: 600 }}
                            >
                                View <ArrowRight size={16} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
