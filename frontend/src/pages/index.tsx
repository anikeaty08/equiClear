'use client';

import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { AuctionGrid, DisconnectedState } from '@/components';
import { useStore } from '@/store';
import { useWallet } from '@/contexts/WalletContext';
import api from '@/services/api';
import { 
    TrendingDown, Shield, Coins, Zap, ArrowRight, 
    Clock, Users, Sparkles, Lock, Globe, Eye, CheckCircle
} from 'lucide-react';

export default function HomePage() {
    const { auctions, setAuctions, isLoading, setLoading } = useStore();
    const { connected } = useWallet();
    const [initialLoaded, setInitialLoaded] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;

        const loadAuctions = async () => {
            setLoading(true);
            try {
                const data = await api.getAuctions(connected ? '1' : undefined);
                if (!cancelled) {
                    const now = new Date();
                    const filtered = connected
                        ? data.filter((auction) => {
                            const start = new Date(auction.start_time);
                            const end = new Date(auction.end_time);
                            return auction.status === 1 && start <= now && end > now;
                        })
                        : data;

                    setAuctions(filtered);
                    setInitialLoaded(true);
                }
            } catch (error) {
                console.error('Failed to load auctions', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAuctions();

        return () => {
            cancelled = true;
        };
    }, [setAuctions, setLoading, connected]);

    // Show feature showcase when not connected
    if (!connected) {
        const features = [
            {
                icon: <Shield size={36} />,
                title: 'Private Bidding',
                desc: 'Zero-knowledge proofs ensure your bids remain completely private until auction settlement',
                color: 'rgba(99, 102, 241, 0.2)',
                iconColor: '#6366f1',
                gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))'
            },
            {
                icon: <TrendingDown size={36} />,
                title: 'Dutch Auctions',
                desc: 'Prices start high and decrease over time. Buyers accept when price reaches their valuation',
                color: 'rgba(34, 211, 238, 0.2)',
                iconColor: '#22d3ee',
                gradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.05))'
            },
            {
                icon: <Zap size={36} />,
                title: 'Uniform Clearing',
                desc: 'All winners pay the same final clearing price - fair and transparent for everyone',
                color: 'rgba(245, 158, 11, 0.2)',
                iconColor: '#f59e0b',
                gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
            },
            {
                icon: <Coins size={36} />,
                title: 'Real Aleo Credits',
                desc: 'Deposit and bid with real Aleo testnet credits. Fully on-chain and verifiable',
                color: 'rgba(16, 185, 129, 0.2)',
                iconColor: '#10b981',
                gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
            },
            {
                icon: <Eye size={36} />,
                title: 'Transparent & Private',
                desc: 'Public auction data with private bid details - best of both worlds',
                color: 'rgba(139, 92, 246, 0.2)',
                iconColor: '#8b5cf6',
                gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))'
            },
            {
                icon: <Globe size={36} />,
                title: 'Fully Decentralized',
                desc: 'Built on Aleo blockchain - no central authority, fully trustless and secure',
                color: 'rgba(236, 72, 153, 0.2)',
                iconColor: '#ec4899',
                gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05))'
            }
        ];

        const benefits = [
            'No front-running attacks',
            'Fair price discovery',
            'Privacy-preserving',
            'Instant settlement',
            'On-chain verification',
            'Dutch auction mechanics'
        ];

        const phases = [
            {
                title: 'Phase 1: Core Auctions',
                status: 'Live',
                desc: 'Private bidding, deposits, and settlement on Aleo testnet.',
                highlight: true
            },
            {
                title: 'Phase 2: Advanced Settlement',
                status: 'Next',
                desc: 'Batch claims, better refunds, and deeper auction analytics.',
                highlight: false
            },
            {
                title: 'Phase 3: Bonus Features',
                status: 'Planned',
                desc: 'Cross-auction strategy tools and richer portfolio insights.',
                highlight: false
            }
        ];

        return (
            <>
                <Head>
                    <title>EquiClear - Decentralized Dutch Auctions</title>
                </Head>

                <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ 
                            textAlign: 'center', 
                            marginBottom: 'var(--space-3xl)',
                            maxWidth: '1000px',
                            margin: '0 auto var(--space-3xl)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            style={{
                                display: 'inline-flex',
                                padding: 'var(--space-xl)',
                                borderRadius: 'var(--radius-xl)',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.2))',
                                marginBottom: 'var(--space-xl)',
                                border: '1px solid var(--glass-border)',
                                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            <Sparkles size={56} style={{ color: 'var(--color-primary)' }} />
                        </motion.div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                            fontWeight: 800,
                            marginBottom: 'var(--space-lg)',
                            background: 'linear-gradient(135deg, #6366f1, #22d3ee, #f59e0b)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2
                        }}>
                            EquiClear
                        </h1>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-xl)',
                            lineHeight: 1.6,
                            maxWidth: '800px',
                            margin: '0 auto var(--space-xl)'
                        }}>
                            Privacy-preserving Dutch auctions on Aleo. Bid privately, settle fairly, trade securely with real Aleo testnet credits.
                        </p>

                        {/* Benefits Pills */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 'var(--space-md)',
                            justifyContent: 'center',
                            marginBottom: 'var(--space-2xl)'
                        }}>
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-xs)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid var(--glass-border)',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                    {benefit}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Feature Cards Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="grid grid-cols-3"
                        style={{ gap: 'var(--space-xl)', marginBottom: 'var(--space-3xl)' }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="glass-card"
                                style={{
                                    padding: 'var(--space-xl)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--glass-border)',
                                    background: feature.gradient,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Hover effect overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(34, 211, 238, 0.05))',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease',
                                    pointerEvents: 'none'
                                }} className="hover-overlay" />
                                
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: feature.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 'var(--space-lg)',
                                    color: feature.iconColor,
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    marginBottom: 'var(--space-sm)',
                                    color: 'var(--text-primary)'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '1rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6
                                }}>
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* How It Works Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        style={{
                            padding: 'var(--space-2xl)',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(34, 211, 238, 0.05))',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--glass-border)',
                            marginBottom: 'var(--space-3xl)'
                        }}
                    >
                        <h2 style={{
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            marginBottom: 'var(--space-xl)',
                            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            How It Works
                        </h2>
                        <div className="grid grid-cols-4" style={{ gap: 'var(--space-lg)' }}>
                            {[
                                { step: '1', title: 'Connect Wallet', desc: 'Link your Puzzle or Leo wallet to get started', icon: <Lock size={24} /> },
                                { step: '2', title: 'Deposit Credits', desc: 'Add real Aleo testnet credits to your internal balance', icon: <Coins size={24} /> },
                                { step: '3', title: 'Place Bids', desc: 'Submit private bids on active Dutch auctions', icon: <TrendingDown size={24} /> },
                                { step: '4', title: 'Settle & Claim', desc: 'Winners pay clearing price, losers get full refunds', icon: <Zap size={24} /> }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 + i * 0.1 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto var(--space-md)',
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                                        position: 'relative'
                                    }}>
                                        <span style={{ position: 'absolute', color: 'white' }}>{item.step}</span>
                                        <div style={{ position: 'absolute', opacity: 0.3, color: 'white' }}>
                                            {item.icon}
                                        </div>
                                    </div>
                                    <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '1.1rem', fontWeight: 600 }}>
                                        {item.title}
                                    </h4>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Phases Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.35 }}
                        style={{
                            marginBottom: 'var(--space-3xl)',
                            padding: 'var(--space-2xl)',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255, 255, 255, 0.03)'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                            <h2 style={{ marginBottom: 'var(--space-sm)' }}>Product Phases</h2>
                            <p className="text-secondary">
                                Each phase ships for a reason, building trust step-by-step.
                            </p>
                        </div>

                        <div style={{ position: 'relative', padding: 'var(--space-lg) 0' }}>
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: '2px',
                                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(255,255,255,0.08))',
                                transform: 'translateX(-1px)'
                            }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                                {phases.map((phase, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 40px 1fr',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ textAlign: i % 2 === 0 ? 'right' : 'left' }}>
                                            {i % 2 === 0 && (
                                                <PhaseCard phase={phase} />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                background: phase.highlight ? '#6366f1' : 'rgba(255,255,255,0.3)',
                                                boxShadow: phase.highlight ? '0 0 12px rgba(99, 102, 241, 0.6)' : 'none'
                                            }} />
                                        </div>
                                        <div style={{ textAlign: i % 2 === 0 ? 'left' : 'right' }}>
                                            {i % 2 !== 0 && (
                                                <PhaseCard phase={phase} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Connect Wallet CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                    >
                        <DisconnectedState
                            title="Ready to Start?"
                            message="Connect your Puzzle or Leo wallet to see live auctions and start bidding with real Aleo testnet credits"
                            showFeatures={false}
                        />
                    </motion.div>
                </div>

                <style jsx>{`
                    .hover-overlay:hover {
                        opacity: 1 !important;
                    }
                `}</style>
            </>
        );
    }

    // Connected state - show auctions
    return (
        <>
            <Head>
                <title>EquiClear - Dutch Auctions</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--space-2xl)' }}
                >
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                        <div>
                            <h1 style={{ marginBottom: 'var(--space-sm)' }}>Live Auctions</h1>
                    <p className="text-secondary">
                        Deposit into your internal wallet, place private bids, and withdraw after settlement.
                    </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="glass-card"
                            style={{
                                padding: 'var(--space-md) var(--space-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <Clock size={20} style={{ color: 'var(--color-secondary)' }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {auctions.filter(a => a.status === 1).length} Active
                            </span>
                        </motion.div>
                    </div>
                </motion.div>

                <AuctionGrid
                    auctions={auctions}
                    loading={!initialLoaded && isLoading}
                />
            </div>
        </>
    );
}

function PhaseCard({ phase }: { phase: { title: string; status: string; desc: string; highlight: boolean } }) {
    return (
        <div
            className="glass-card"
            style={{
                display: 'inline-block',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                border: phase.highlight ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--glass-border)',
                background: phase.highlight
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(34, 211, 238, 0.06))'
                    : 'rgba(255, 255, 255, 0.02)'
            }}
        >
            <div style={{
                display: 'inline-flex',
                padding: '4px 10px',
                borderRadius: '999px',
                background: phase.highlight ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: phase.highlight ? '#c7d2fe' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                marginBottom: 'var(--space-sm)'
            }}>
                {phase.status}
            </div>
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>{phase.title}</h3>
            <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                {phase.desc}
            </p>
        </div>
    );
}
