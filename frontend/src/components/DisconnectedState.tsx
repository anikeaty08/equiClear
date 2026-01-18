'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, Shield, Zap, Lock, TrendingDown, Coins, CheckCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface DisconnectedStateProps {
    title?: string;
    message?: string;
    showFeatures?: boolean;
}

export default function DisconnectedState({ 
    title = 'Connect Your Wallet',
    message = 'Connect your Puzzle or Leo wallet to start participating in Dutch auctions',
    showFeatures = true
}: DisconnectedStateProps) {
    const { connect, loading } = useWallet();
    
    const quickFeatures = [
        { icon: <Shield size={20} />, text: 'Private Bids' },
        { icon: <TrendingDown size={20} />, text: 'Dutch Auctions' },
        { icon: <Coins size={20} />, text: 'Real Credits' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
                padding: 'var(--space-2xl)',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(34, 211, 238, 0.1))',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{
                    width: '96px',
                    height: '96px',
                    margin: '0 auto var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                }}
            >
                <Wallet size={48} color="white" />
            </motion.div>

            <h2 style={{ 
                marginBottom: 'var(--space-md)', 
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                {title}
            </h2>
            <p className="text-secondary" style={{ 
                marginBottom: 'var(--space-xl)', 
                fontSize: '1.1rem',
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto var(--space-xl)'
            }}>
                {message}
            </p>

            {/* Quick Features */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
                justifyContent: 'center',
                marginBottom: 'var(--space-xl)'
            }}>
                {quickFeatures.map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: 'var(--space-sm) var(--space-md)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <div style={{ color: 'var(--color-primary)' }}>
                            {feature.icon}
                        </div>
                        {feature.text}
                    </motion.div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={connect}
                disabled={loading}
                className="btn btn-primary btn-glow"
                style={{
                    padding: 'var(--space-lg) var(--space-2xl)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: showFeatures ? 'var(--space-xl)' : 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    borderRadius: 'var(--radius-lg)',
                }}
            >
                {loading ? (
                    <>
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <Wallet size={22} />
                        </motion.span>
                        Connecting...
                    </>
                ) : (
                    <>
                        <Wallet size={22} />
                        Connect Wallet
                        <ArrowRight size={22} />
                    </>
                )}
            </motion.button>

            {showFeatures && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-3"
                    style={{
                        gap: 'var(--space-lg)',
                        marginTop: 'var(--space-xl)',
                        paddingTop: 'var(--space-xl)',
                        borderTop: '1px solid var(--glass-border)',
                    }}
                >
                    <FeatureItem
                        icon={<Shield size={28} />}
                        title="Private Bids"
                        description="ZK proofs ensure your bids remain completely private until settlement"
                    />
                    <FeatureItem
                        icon={<Zap size={28} />}
                        title="Instant Settlement"
                        description="Dutch auctions with uniform clearing price - fair for everyone"
                    />
                    <FeatureItem
                        icon={<Lock size={28} />}
                        title="Secure Deposits"
                        description="Deposit real Aleo testnet credits safely and withdraw anytime"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            style={{ 
                textAlign: 'center',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                transition: 'all 0.3s ease'
            }}
        >
            <div
                style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(34, 211, 238, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--glass-border)'
                }}
            >
                {icon}
            </div>
            <h4 style={{ 
                marginBottom: 'var(--space-xs)', 
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
            }}>
                {title}
            </h4>
            <p className="text-muted" style={{ 
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
            }}>
                {description}
            </p>
        </motion.div>
    );
}
