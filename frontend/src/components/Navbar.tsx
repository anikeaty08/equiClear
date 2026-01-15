'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Menu, X } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export default function Navbar() {
    const { connected, address, connect, disconnect, loading } = useWallet();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleConnect = async () => {
        try {
            await connect();
        } catch (error: any) {
            console.error('Connection failed:', error);
            alert(error.message || 'Failed to connect wallet. Make sure Leo Wallet extension is installed and unlocked.');
        }
    };

    const handleDisconnect = async () => {
        await disconnect();
    };

    const navLinks = [
        { href: '/', label: 'Dashboard' },
        { href: '/wallet', label: 'Wallet' },
        { href: '/claims', label: 'Claims' },
        { href: '/create-auction', label: 'Create' },
    ];

    return (
        <nav className="nav">
            <div className="container nav-content">
                {/* Logo */}
                <Link href="/" className="nav-logo">
                    <span className="gradient-text">EquiClear</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden-mobile visible-desktop items-center gap-lg">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="nav-link">
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Wallet Button */}
                <div className="flex items-center gap-md">
                    {connected ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-secondary"
                            onClick={handleDisconnect}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            <Wallet size={18} />
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {address?.slice(0, 8)}...{address?.slice(-4)}
                            </span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary btn-glow"
                            onClick={handleConnect}
                            disabled={loading}
                        >
                            <Wallet size={18} />
                            {loading ? 'Connecting...' : 'Connect Wallet'}
                        </motion.button>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="hidden-desktop btn btn-secondary"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ padding: '0.5rem' }}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        padding: 'var(--space-lg)',
                        margin: 'var(--space-md)',
                        borderRadius: 'var(--radius-lg)',
                    }}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="nav-link"
                            style={{
                                display: 'block',
                                padding: 'var(--space-md) 0',
                                borderBottom: '1px solid var(--glass-border)',
                            }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </motion.div>
            )}
        </nav>
    );
}
