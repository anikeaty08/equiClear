'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';

export default function Notifications() {
    const { notifications, removeNotification } = useStore();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />;
            case 'error':
                return <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />;
            case 'warning':
                return <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />;
            default:
                return <Info size={20} style={{ color: 'var(--color-primary)' }} />;
        }
    };

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'rgba(16, 185, 129, 0.5)';
            case 'error':
                return 'rgba(239, 68, 68, 0.5)';
            case 'warning':
                return 'rgba(245, 158, 11, 0.5)';
            default:
                return 'rgba(99, 102, 241, 0.5)';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 'var(--space-xl)',
                right: 'var(--space-xl)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                maxWidth: '400px',
                width: '100%',
                pointerEvents: 'none',
            }}
        >
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className="glass-card"
                        style={{
                            padding: 'var(--space-lg)',
                            borderLeft: `3px solid ${getBorderColor(notification.type)}`,
                            pointerEvents: 'auto',
                        }}
                    >
                        <div className="flex items-start gap-md">
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                {getIcon(notification.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{
                                    margin: '0 0 var(--space-xs) 0',
                                    fontSize: '0.95rem',
                                    fontWeight: 600
                                }}>
                                    {notification.title}
                                </h4>
                                <p className="text-secondary" style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    lineHeight: 1.4
                                }}>
                                    {notification.message}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeNotification(notification.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 'var(--space-xs)',
                                    color: 'var(--text-muted)',
                                    flexShrink: 0,
                                }}
                            >
                                <X size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
