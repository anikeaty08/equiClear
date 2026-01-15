'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Menu, X } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';

export default function Navbar() {
    const { wallet, setWallet, resetWallet } = useStore();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isConnecting, setIsConnecting] = React.useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const state = await aleoWallet.connect();
            setWallet(state);
        } catch (error: any) {
            console.error('Connection failed:', error);
            alert(error.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        await aleoWallet.disconnect();
        resetWallet();
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

                {/* Desktop Navigation */}
                <ul className="nav-links" style={{ display: 'none' }}>
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className="nav-link">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <style jsx>{`
          @media (min-width: 768px) {
            .nav-links {
              display: flex !important;
            }
            .mobile-menu-btn {
              display: none !important;
            }
          }
        `}</style>

                {/* Desktop Nav Links */}
                <div className="flex items-center gap-lg" style={{ display: 'none' }}>
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="nav-link">
                            {link.label}
                        </Link>
                    ))}
                </div>

                <style jsx>{`
          @media (min-width: 768px) {
            .flex.items-center.gap-lg {
              display: flex !important;
            }
          }
        `}</style>

                {/* Wallet Button */}
                <div className="flex items-center gap-md">
                    {wallet.connected ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-secondary"
                            onClick={handleDisconnect}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            <Wallet size={18} />
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-4)}
                            </span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary btn-glow"
                            onClick={handleConnect}
                            disabled={isConnecting}
                        >
                            <Wallet size={18} />
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </motion.button>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn btn btn-secondary"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ padding: '0.5rem', display: 'block' }}
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

            <style jsx>{`
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
        </nav>
    );
}
