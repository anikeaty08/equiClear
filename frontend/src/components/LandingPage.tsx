import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap, Lock } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export function LandingPage() {
    const { connect, loading } = useWallet();

    return (
        <div className="landing-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                borderRadius: '50%',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                borderRadius: '50%',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card"
                style={{
                    padding: 'var(--space-2xl)',
                    maxWidth: '480px',
                    width: '90%',
                    textAlign: 'center',
                    border: '1px solid var(--glass-border)',
                    zIndex: 10
                }}
            >
                <div style={{
                    marginBottom: 'var(--space-xl)',
                    display: 'inline-flex',
                    padding: 'var(--space-md)',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--color-primary)'
                }}>
                    <Lock size={48} />
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    marginBottom: 'var(--space-md)',
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    EquiClear Access
                </h1>

                <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', fontSize: '1.1rem' }}>
                    Connect your Aleo wallet to access the decentralized Dutch auction platform.
                </p>

                <div className="features-grid" style={{
                    display: 'grid',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)',
                    textAlign: 'left'
                }}>
                    <div className="flex items-center gap-sm text-sm text-secondary">
                        <Shield size={16} className="text-primary" />
                        <span>Resistant to front-running</span>
                    </div>
                    <div className="flex items-center gap-sm text-sm text-secondary">
                        <Zap size={16} className="text-primary" />
                        <span>Uniform clearing price</span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={connect}
                    disabled={loading}
                    className="btn btn-primary btn-glow"
                    style={{
                        width: '100%',
                        padding: 'var(--space-lg)',
                        fontSize: '1.1rem',
                        justifyContent: 'center'
                    }}
                >
                    {loading ? (
                        <span className="flex items-center gap-sm">
                            <span className="spinner" /> Connecting...
                        </span>
                    ) : (
                        <span className="flex items-center gap-sm">
                            <Wallet size={20} />
                            Connect Wallet
                        </span>
                    )}
                </motion.button>

                <p style={{ marginTop: 'var(--space-lg)', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                    Supports Leo Wallet and Puzzle Wallet
                </p>
            </motion.div>
        </div>
    );
}
