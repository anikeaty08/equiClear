'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, Shield, Zap, Lock, TrendingDown, Coins, 
    Eye, ArrowRight, CheckCircle, Sparkles, Globe 
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export function LandingPage() {
    const { connect, loading } = useWallet();

    const features = [
        {
            icon: <Shield size={32} />,
            title: 'Private Bids',
            description: 'Zero-knowledge proofs ensure your bids remain completely private until settlement',
            color: 'rgba(99, 102, 241, 0.2)',
            iconColor: '#6366f1'
        },
        {
            icon: <TrendingDown size={32} />,
            title: 'Dutch Auctions',
            description: 'Prices start high and decrease over time until buyers accept the current price',
            color: 'rgba(34, 211, 238, 0.2)',
            iconColor: '#22d3ee'
        },
        {
            icon: <Zap size={32} />,
            title: 'Uniform Clearing',
            description: 'All winners pay the same final clearing price - fair and transparent',
            color: 'rgba(245, 158, 11, 0.2)',
            iconColor: '#f59e0b'
        },
        {
            icon: <Coins size={32} />,
            title: 'Real Credits',
            description: 'Deposit and bid with real Aleo testnet credits - fully on-chain',
            color: 'rgba(16, 185, 129, 0.2)',
            iconColor: '#10b981'
        },
        {
            icon: <Eye size={32} />,
            title: 'Transparent',
            description: 'Public auction data with private bid details - best of both worlds',
            color: 'rgba(139, 92, 246, 0.2)',
            iconColor: '#8b5cf6'
        },
        {
            icon: <Globe size={32} />,
            title: 'Decentralized',
            description: 'Built on Aleo blockchain - no central authority, fully trustless',
            color: 'rgba(236, 72, 153, 0.2)',
            iconColor: '#ec4899'
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

    return (
        <div className="landing-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
            color: 'var(--text-primary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '800px',
                height: '800px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                animation: 'pulse 8s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '700px',
                height: '700px',
                background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                animation: 'pulse 10s ease-in-out infinite'
            }} />

            {/* Hero Section */}
            <div className="container" style={{
                paddingTop: 'var(--space-3xl)',
                paddingBottom: 'var(--space-3xl)',
                position: 'relative',
                zIndex: 10
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        style={{
                            display: 'inline-flex',
                            padding: 'var(--space-xl)',
                            borderRadius: 'var(--radius-xl)',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.2))',
                            marginBottom: 'var(--space-xl)',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        <Sparkles size={64} style={{ color: 'var(--color-primary)' }} />
                    </motion.div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
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
                        maxWidth: '700px',
                        margin: '0 auto var(--space-xl)',
                        lineHeight: 1.6
                    }}>
                        Privacy-preserving Dutch auctions on Aleo. Bid privately, settle fairly, trade securely.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={connect}
                        disabled={loading}
                        className="btn btn-primary btn-glow"
                        style={{
                            padding: 'var(--space-lg) var(--space-2xl)',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-lg)',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-xl)'
                        }}
                    >
                        {loading ? (
                            <>
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                >
                                    <Wallet size={24} />
                                </motion.span>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Wallet size={24} />
                                Connect Wallet to Start
                                <ArrowRight size={24} />
                            </>
                        )}
                    </motion.button>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--space-md)',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)'
                    }}>
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 'var(--radius-full)',
                                    border: '1px solid var(--glass-border)'
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
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="grid grid-cols-3"
                    style={{
                        gap: 'var(--space-xl)',
                        marginTop: 'var(--space-3xl)'
                    }}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="glass-card"
                            style={{
                                padding: 'var(--space-xl)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--glass-border)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: 'var(--radius-md)',
                                background: feature.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-lg)',
                                color: feature.iconColor
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: 'var(--space-sm)',
                                color: 'var(--text-primary)'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                fontSize: '0.95rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6
                            }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* How It Works Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{
                        marginTop: 'var(--space-3xl)',
                        padding: 'var(--space-2xl)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(34, 211, 238, 0.05))',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--glass-border)'
                    }}
                >
                    <h2 style={{
                        fontSize: '2rem',
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
                            { step: '1', title: 'Connect Wallet', desc: 'Link your Puzzle or Leo wallet' },
                            { step: '2', title: 'Deposit Credits', desc: 'Add Aleo testnet credits to your balance' },
                            { step: '3', title: 'Place Bids', desc: 'Submit private bids on active auctions' },
                            { step: '4', title: 'Settle & Claim', desc: 'Winners pay clearing price, losers get refunds' }
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-md)',
                                    fontWeight: 700,
                                    fontSize: '1.25rem'
                                }}>
                                    {item.step}
                                </div>
                                <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '1.1rem' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
