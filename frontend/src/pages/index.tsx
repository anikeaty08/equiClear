'use client';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Shield,
    Zap,
    Globe,
    ArrowRight,
    TrendingDown,
    Users,
    Lock
} from 'lucide-react';
import { AuctionGrid } from '@/components';
import { api, Auction, Stats } from '@/services/api';

export default function Home() {
    const [auctions, setAuctions] = React.useState<Auction[]>([]);
    const [stats, setStats] = React.useState<Stats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'active' | 'upcoming' | 'settled'>('all');

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [auctionsData, statsData] = await Promise.all([
                api.getAuctions(),
                api.getStats(),
            ]);
            setAuctions(auctionsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            // Use demo data if API fails
            setAuctions(getDemoAuctions());
            setStats({ total_auctions: 12, active_auctions: 4, total_volume: 125000, total_bids: 89 });
        } finally {
            setLoading(false);
        }
    };

    const filteredAuctions = auctions.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'active') return a.status === 1;
        if (filter === 'upcoming') return a.status === 0;
        if (filter === 'settled') return a.status === 2;
        return true;
    });

    const features = [
        {
            icon: TrendingDown,
            title: 'Dutch Auction',
            description: 'Prices start high and decrease over time until items sell out.',
        },
        {
            icon: Users,
            title: 'Uniform Clearing',
            description: 'All winners pay the same final price, ensuring complete fairness.',
        },
        {
            icon: Lock,
            title: 'Private Bids',
            description: 'Zero-knowledge proofs keep your bid amounts completely private.',
        },
        {
            icon: Globe,
            title: 'Cross-Chain Ready',
            description: 'Architecture designed for future cross-chain bidding support.',
        },
    ];

    return (
        <>
            <Head>
                <title>EquiClear - Decentralized Dutch Auctions on Aleo</title>
            </Head>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span
                            className="badge badge-live"
                            style={{
                                marginBottom: 'var(--space-lg)',
                                fontSize: '0.8rem',
                                padding: 'var(--space-sm) var(--space-lg)',
                            }}
                        >
                            <Sparkles size={14} style={{ marginRight: '6px' }} />
                            Now Live on Aleo Testnet
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        Fair Auctions.{' '}
                        <span className="gradient-text">Private Bids.</span>
                        <br />
                        Equal Pricing.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        EquiClear brings privacy-preserving Dutch auctions to Aleo.
                        Bid privately with zero-knowledge proofs and pay a uniform clearing price.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hero-buttons"
                    >
                        <Link href="#auctions">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary btn-glow"
                                style={{ padding: 'var(--space-lg) var(--space-2xl)' }}
                            >
                                Explore Auctions
                                <ArrowRight size={20} />
                            </motion.button>
                        </Link>
                        <Link href="/create-auction">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-secondary"
                                style={{ padding: 'var(--space-lg) var(--space-2xl)' }}
                            >
                                Create Auction
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>

                {/* Floating Elements */}
                <motion.div
                    className="floating"
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '10%',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.1)',
                        filter: 'blur(40px)',
                    }}
                />
                <motion.div
                    className="floating"
                    style={{
                        position: 'absolute',
                        bottom: '30%',
                        right: '15%',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'rgba(34, 211, 238, 0.1)',
                        filter: 'blur(50px)',
                        animationDelay: '-3s',
                    }}
                />
            </section>

            {/* Stats Section */}
            <section className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
                <div className="stats-grid">
                    {[
                        { label: 'Total Auctions', value: stats?.total_auctions || 0 },
                        { label: 'Active Now', value: stats?.active_auctions || 0 },
                        { label: 'Total Volume', value: `${((stats?.total_volume || 0) / 1000).toFixed(0)}K` },
                        { label: 'Total Bids', value: stats?.total_bids || 0 },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="glass-card stat-card"
                        >
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                    style={{ marginBottom: 'var(--space-2xl)' }}
                >
                    <h2>Why EquiClear?</h2>
                    <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        A new paradigm for fair, private, and efficient digital asset auctions
                    </p>
                </motion.div>

                <div className="grid grid-cols-4">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i }}
                            className="glass-card card-3d"
                            style={{ padding: 'var(--space-xl)', textAlign: 'center' }}
                        >
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-lg)',
                                }}
                            >
                                <feature.icon size={28} className="text-secondary" />
                            </div>
                            <h4 style={{ marginBottom: 'var(--space-sm)' }}>{feature.title}</h4>
                            <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Auctions Section */}
            <section id="auctions" className="container" style={{ paddingBottom: 'var(--space-3xl)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Live Auctions</h2>
                        <p className="text-secondary" style={{ margin: 0 }}>Discover and bid on active Dutch auctions</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-sm">
                        {(['all', 'active', 'upcoming', 'settled'] as const).map((f) => (
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
                </div>

                <AuctionGrid auctions={filteredAuctions} loading={loading} />
            </section>
        </>
    );
}

// Demo auctions for when API is not available
function getDemoAuctions(): Auction[] {
    const now = new Date();
    const hour = 60 * 60 * 1000;

    return [
        {
            id: '1',
            auction_id: 'demo001abc',
            creator: 'aleo1demo...',
            item_name: 'Rare NFT Collection',
            item_description: 'A collection of 100 unique digital art pieces',
            total_supply: 100,
            remaining_supply: 45,
            start_price: 10000,
            reserve_price: 2000,
            start_time: new Date(now.getTime() - 2 * hour).toISOString(),
            end_time: new Date(now.getTime() + 4 * hour).toISOString(),
            status: 1,
        },
        {
            id: '2',
            auction_id: 'demo002def',
            creator: 'aleo1demo...',
            item_name: 'Premium Access Pass',
            item_description: 'Exclusive access to the EquiClear premium features',
            total_supply: 50,
            remaining_supply: 50,
            start_price: 5000,
            reserve_price: 1000,
            start_time: new Date(now.getTime() + 2 * hour).toISOString(),
            end_time: new Date(now.getTime() + 8 * hour).toISOString(),
            status: 0,
        },
        {
            id: '3',
            auction_id: 'demo003ghi',
            creator: 'aleo1demo...',
            item_name: 'Genesis Tokens',
            item_description: 'Limited edition genesis tokens for early supporters',
            total_supply: 200,
            remaining_supply: 0,
            start_price: 3000,
            reserve_price: 500,
            clearing_price: 1200,
            start_time: new Date(now.getTime() - 10 * hour).toISOString(),
            end_time: new Date(now.getTime() - 2 * hour).toISOString(),
            status: 2,
        },
    ];
}
