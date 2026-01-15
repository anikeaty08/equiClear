'use client';
import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    Users,
    TrendingDown,
    Shield,
    ExternalLink,
    Share2,
    Copy,
    CheckCircle
} from 'lucide-react';
import { BidForm } from '@/components';
import { api, Auction, CurrentPrice, BidAggregate } from '@/services/api';
import { differenceInSeconds, formatDistanceToNow } from 'date-fns';

export default function AuctionDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [auction, setAuction] = React.useState<Auction | null>(null);
    const [priceData, setPriceData] = React.useState<CurrentPrice | null>(null);
    const [bidAggregate, setBidAggregate] = React.useState<BidAggregate | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        if (id) {
            loadAuction(id as string);
        }
    }, [id]);

    // Update price every second
    React.useEffect(() => {
        if (!auction || auction.status !== 1) return;

        const interval = setInterval(() => {
            api.getCurrentPrice(auction.auction_id)
                .then(setPriceData)
                .catch(console.error);
        }, 1000);

        return () => clearInterval(interval);
    }, [auction]);

    const loadAuction = async (auctionId: string) => {
        setLoading(true);
        try {
            const [auctionData, priceRes, bidRes] = await Promise.all([
                api.getAuction(auctionId),
                api.getCurrentPrice(auctionId).catch(() => null),
                api.getBidAggregate(auctionId).catch(() => null),
            ]);
            setAuction(auctionData);
            setPriceData(priceRes);
            setBidAggregate(bidRes);
        } catch (error) {
            console.error('Failed to load auction:', error);
            // Demo data
            setAuction(getDemoAuction());
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--space-2xl)' }}>
                <div className="glass-card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
                    <div className="skeleton" style={{ width: '60%', height: '40px', margin: '0 auto var(--space-lg)' }} />
                    <div className="skeleton" style={{ width: '80%', height: '20px', margin: '0 auto var(--space-md)' }} />
                    <div className="skeleton" style={{ width: '40%', height: '20px', margin: '0 auto' }} />
                </div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="container" style={{ paddingTop: 'var(--space-2xl)', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: 'var(--space-3xl)' }}>
                    <h2>Auction Not Found</h2>
                    <p className="text-secondary">The auction you're looking for doesn't exist.</p>
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="btn btn-primary"
                            style={{ marginTop: 'var(--space-lg)' }}
                        >
                            Back to Auctions
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    const now = new Date();
    const isActive = auction.status === 1;
    const isUpcoming = auction.status === 0;
    const isSettled = auction.status === 2;

    const currentPrice = priceData?.current_price || calculatePrice(auction, now);
    const progressPercent = priceData?.progress_percent ||
        (isActive ? Math.min(100, (differenceInSeconds(now, startTime) / differenceInSeconds(endTime, startTime)) * 100) : 0);

    return (
        <>
            <Head>
                <title>{auction.item_name || 'Auction'} - EquiClear</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
                {/* Back Button */}
                <Link href="/">
                    <motion.button
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-sm text-secondary"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: 'var(--space-xl)',
                            fontSize: '0.9rem',
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Auctions
                    </motion.button>
                </Link>

                <div className="grid grid-cols-3" style={{ gap: 'var(--space-xl)' }}>
                    {/* Left Column - Auction Details */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}
                        >
                            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-lg)' }}>
                                <div>
                                    {isActive && <span className="badge badge-live">● Live Now</span>}
                                    {isUpcoming && <span className="badge badge-upcoming">Upcoming</span>}
                                    {isSettled && <span className="badge badge-settled">Settled</span>}
                                </div>
                                <div className="flex gap-sm">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCopyLink}
                                        className="btn btn-secondary"
                                        style={{ padding: 'var(--space-sm)' }}
                                    >
                                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn btn-secondary"
                                        style={{ padding: 'var(--space-sm)' }}
                                    >
                                        <Share2 size={18} />
                                    </motion.button>
                                </div>
                            </div>

                            <h1 style={{ marginBottom: 'var(--space-md)' }}>
                                {auction.item_name || `Auction #${auction.auction_id.slice(0, 8)}`}
                            </h1>
                            <p className="text-secondary" style={{ fontSize: '1.1rem', marginBottom: 0 }}>
                                {auction.item_description || 'Dutch auction with uniform clearing price mechanism'}
                            </p>
                        </motion.div>

                        {/* Price Display Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card glow-effect"
                            style={{
                                padding: 'var(--space-xl)',
                                marginBottom: 'var(--space-xl)',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(34, 211, 238, 0.05))',
                            }}
                        >
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                                <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                                    {isSettled ? 'Final Clearing Price' : isActive ? 'Current Price' : 'Starting Price'}
                                </span>
                                {isActive && (
                                    <div className="flex items-center gap-sm text-secondary">
                                        <TrendingDown size={18} />
                                        <span style={{ fontSize: '0.875rem' }}>Price decreasing</span>
                                    </div>
                                )}
                            </div>

                            <div className="price-display" style={{ fontSize: '3.5rem', marginBottom: 'var(--space-lg)' }}>
                                {isSettled && auction.clearing_price
                                    ? auction.clearing_price.toLocaleString()
                                    : currentPrice.toLocaleString()
                                }
                                <span style={{ fontSize: '1.25rem', opacity: 0.6, marginLeft: 'var(--space-sm)' }}>credits</span>
                            </div>

                            {/* Price Progress */}
                            {isActive && (
                                <>
                                    <div className="progress-bar" style={{ height: '12px', marginBottom: 'var(--space-md)' }}>
                                        <motion.div
                                            className="progress-fill"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-muted" style={{ fontSize: '0.875rem' }}>
                                        <span>Start: {auction.start_price.toLocaleString()}</span>
                                        <span>Reserve: {auction.reserve_price.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Countdown Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}
                        >
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                                <Clock size={24} className="text-secondary" />
                                <h3 style={{ margin: 0 }}>
                                    {isActive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Auction Ended'}
                                </h3>
                            </div>

                            {!isSettled && (
                                <CountdownTimer targetTime={isActive ? endTime : startTime} />
                            )}

                            {isSettled && (
                                <p className="text-secondary" style={{ margin: 0 }}>
                                    Ended {formatDistanceToNow(endTime, { addSuffix: true })}
                                </p>
                            )}
                        </motion.div>

                        {/* Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card"
                            style={{ padding: 'var(--space-xl)' }}
                        >
                            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Auction Stats</h3>
                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                                <StatItem
                                    icon={Users}
                                    label="Total Supply"
                                    value={auction.total_supply.toString()}
                                />
                                <StatItem
                                    icon={Users}
                                    label="Remaining"
                                    value={auction.remaining_supply.toString()}
                                />
                                <StatItem
                                    icon={Shield}
                                    label="Total Bids"
                                    value={bidAggregate?.bid_count?.toString() || '0'}
                                />
                                <StatItem
                                    icon={TrendingDown}
                                    label="Bid Volume"
                                    value={bidAggregate?.total_volume?.toString() || '0'}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Bid Form */}
                    <div>
                        <div style={{ position: 'sticky', top: 'calc(80px + var(--space-xl))' }}>
                            {isActive ? (
                                <BidForm
                                    auctionId={auction.auction_id}
                                    currentPrice={currentPrice}
                                    reservePrice={auction.reserve_price}
                                    maxQuantity={auction.remaining_supply}
                                />
                            ) : isUpcoming ? (
                                <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                                    <Clock size={48} className="text-secondary" style={{ margin: '0 auto var(--space-lg)' }} />
                                    <h3>Auction Not Started</h3>
                                    <p className="text-secondary">
                                        Bidding will open {formatDistanceToNow(startTime, { addSuffix: true })}
                                    </p>
                                </div>
                            ) : (
                                <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                                    <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-lg)' }} />
                                    <h3>Auction Settled</h3>
                                    <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
                                        Final clearing price: <strong>{auction.clearing_price?.toLocaleString()}</strong> credits
                                    </p>
                                    <Link href="/claims">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                        >
                                            Check Your Claims
                                        </motion.button>
                                    </Link>
                                </div>
                            )}

                            {/* Privacy Note */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-md"
                                style={{
                                    marginTop: 'var(--space-lg)',
                                    padding: 'var(--space-md)',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <Shield size={18} className="text-secondary" style={{ flexShrink: 0 }} />
                                <span className="text-secondary">
                                    Your bid amount is protected by zero-knowledge proofs
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-md">
            <div
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon size={20} className="text-secondary" />
            </div>
            <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
            </div>
        </div>
    );
}

function CountdownTimer({ targetTime }: { targetTime: Date }) {
    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft(targetTime));

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetTime));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    return (
        <div className="countdown">
            <div className="countdown-unit">
                <div className="countdown-value">{timeLeft.days}</div>
                <div className="countdown-label">Days</div>
            </div>
            <div className="countdown-unit">
                <div className="countdown-value">{timeLeft.hours}</div>
                <div className="countdown-label">Hours</div>
            </div>
            <div className="countdown-unit">
                <div className="countdown-value">{timeLeft.minutes}</div>
                <div className="countdown-label">Mins</div>
            </div>
            <div className="countdown-unit">
                <div className="countdown-value">{timeLeft.seconds}</div>
                <div className="countdown-label">Secs</div>
            </div>
        </div>
    );
}

function calculateTimeLeft(targetTime: Date) {
    const now = new Date();
    const diff = Math.max(0, targetTime.getTime() - now.getTime());

    return {
        days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
        minutes: String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0'),
        seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, '0'),
    };
}

function calculatePrice(auction: Auction, now: Date): number {
    const start = new Date(auction.start_time);
    const end = new Date(auction.end_time);

    if (now <= start) return auction.start_price;
    if (now >= end) return auction.reserve_price;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const priceDrop = auction.start_price - auction.reserve_price;
    const decay = (elapsed / totalDuration) * priceDrop;

    return Math.round(auction.start_price - decay);
}

function getDemoAuction(): Auction {
    const now = new Date();
    const hour = 60 * 60 * 1000;

    return {
        id: '1',
        auction_id: 'demo001abc',
        creator: 'aleo1demo...',
        item_name: 'Rare NFT Collection',
        item_description: 'A collection of 100 unique digital art pieces with exclusive access to holder benefits.',
        total_supply: 100,
        remaining_supply: 45,
        start_price: 10000,
        reserve_price: 2000,
        start_time: new Date(now.getTime() - 2 * hour).toISOString(),
        end_time: new Date(now.getTime() + 4 * hour).toISOString(),
        status: 1,
    };
}
