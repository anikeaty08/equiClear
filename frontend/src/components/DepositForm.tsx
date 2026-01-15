'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';

interface DepositFormProps {
    onSuccess?: () => void;
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
    const { wallet, addNotification, setUserBalance, userBalance } = useStore();
    const [amount, setAmount] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const presetAmounts = [100, 500, 1000, 5000];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const depositAmount = parseInt(amount);
        if (!depositAmount || depositAmount <= 0) {
            addNotification({
                type: 'error',
                title: 'Invalid Amount',
                message: 'Please enter a valid deposit amount.',
            });
            return;
        }

        if (!wallet.connected) {
            addNotification({
                type: 'warning',
                title: 'Wallet Required',
                message: 'Please connect your wallet to deposit.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await aleoWallet.deposit('1field', depositAmount);

            if (result.success) {
                setUserBalance(userBalance + depositAmount);
                addNotification({
                    type: 'success',
                    title: 'Deposit Successful!',
                    message: `${depositAmount.toLocaleString()} credits have been deposited to your internal balance.`,
                });
                setAmount('');
                onSuccess?.();
            } else {
                throw new Error(result.error || 'Deposit failed');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Deposit Failed',
                message: error.message || 'Failed to deposit. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: 'var(--space-xl)' }}
        >
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-xl)' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ArrowDownToLine size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Deposit Tokens</h3>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Add tokens to your internal balance
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Amount Input */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label className="text-muted" style={{
                        display: 'block',
                        marginBottom: 'var(--space-sm)',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Amount
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            className="input-glass"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min={1}
                            style={{ paddingRight: '80px' }}
                        />
                        <span
                            className="text-muted"
                            style={{
                                position: 'absolute',
                                right: 'var(--space-lg)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.875rem'
                            }}
                        >
                            credits
                        </span>
                    </div>
                </div>

                {/* Preset Amounts */}
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <span className="text-muted" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        marginBottom: 'var(--space-sm)'
                    }}>
                        Quick amounts
                    </span>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        {presetAmounts.map((preset) => (
                            <motion.button
                                key={preset}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-secondary"
                                onClick={() => setAmount(preset.toString())}
                                style={{
                                    padding: 'var(--space-sm) var(--space-md)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {preset.toLocaleString()}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    disabled={isSubmitting || !wallet.connected || !amount}
                    style={{
                        width: '100%',
                        padding: 'var(--space-md)',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ display: 'inline-block' }}
                            >
                                <Loader2 size={20} />
                            </motion.span>
                            Processing...
                        </>
                    ) : !wallet.connected ? (
                        'Connect Wallet to Deposit'
                    ) : (
                        <>
                            <ArrowDownToLine size={20} />
                            Deposit {amount ? `${parseInt(amount).toLocaleString()} Credits` : ''}
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}
