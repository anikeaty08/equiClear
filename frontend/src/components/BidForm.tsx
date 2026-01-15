'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';

interface BidFormProps {
    auctionId: string;
    currentPrice: number;
    reservePrice: number;
    maxQuantity: number;
    onSuccess?: () => void;
}

export default function BidForm({
    auctionId,
    currentPrice,
    reservePrice,
    maxQuantity,
    onSuccess
}: BidFormProps) {
    const { wallet, addNotification } = useStore();
    const [quantity, setQuantity] = React.useState(1);
    const [maxPrice, setMaxPrice] = React.useState(currentPrice);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const totalCost = quantity * maxPrice;

    const handleQuantityChange = (delta: number) => {
        const newQty = Math.max(1, Math.min(maxQuantity, quantity + delta));
        setQuantity(newQty);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.connected) {
            addNotification({
                type: 'warning',
                title: 'Wallet Required',
                message: 'Please connect your wallet to place a bid.',
            });
            return;
        }

        if (maxPrice < reservePrice) {
            addNotification({
                type: 'error',
                title: 'Invalid Price',
                message: `Max price must be at least ${reservePrice} (reserve price).`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await aleoWallet.placeBid(auctionId, quantity, maxPrice);

            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Bid Placed!',
                    message: `Your bid for ${quantity} item(s) at ${maxPrice} max price has been submitted.`,
                });
                onSuccess?.();
            } else {
                throw new Error(result.error || 'Failed to place bid');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Bid Failed',
                message: error.message || 'Failed to submit bid. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: 'var(--space-xl)' }}
            onSubmit={handleSubmit}
        >
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Place Your Bid</h3>

            {/* Info Box */}
            <div
                className="flex items-center gap-md"
                style={{
                    padding: 'var(--space-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-xl)',
                    fontSize: '0.875rem',
                }}
            >
                <AlertCircle size={20} className="text-secondary" />
                <span className="text-secondary">
                    Your bid is private. Only the final clearing price will be public.
                </span>
            </div>

            {/* Quantity Input */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="text-muted" style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Quantity
                </label>
                <div className="flex items-center gap-md">
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-secondary"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        style={{ padding: 'var(--space-sm)', minWidth: '44px' }}
                    >
                        <Minus size={20} />
                    </motion.button>
                    <input
                        type="number"
                        className="input-glass"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={maxQuantity}
                        style={{ textAlign: 'center', maxWidth: '100px' }}
                    />
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-secondary"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= maxQuantity}
                        style={{ padding: 'var(--space-sm)', minWidth: '44px' }}
                    >
                        <Plus size={20} />
                    </motion.button>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                        / {maxQuantity} available
                    </span>
                </div>
            </div>

            {/* Max Price Input */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="text-muted" style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Maximum Price (per item)
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="number"
                        className="input-glass"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
                        min={reservePrice}
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
                <div className="flex justify-between text-muted" style={{ marginTop: 'var(--space-xs)', fontSize: '0.75rem' }}>
                    <span>Current: {currentPrice.toLocaleString()}</span>
                    <span>Reserve: {reservePrice.toLocaleString()}</span>
                </div>
            </div>

            {/* Total Cost Display */}
            <div
                className="glass-card"
                style={{
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-xl)',
                    background: 'rgba(34, 211, 238, 0.05)',
                    border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
            >
                <div className="flex justify-between items-center">
                    <span className="text-secondary">Total Maximum Cost</span>
                    <span className="price-display" style={{ fontSize: '1.5rem' }}>
                        {totalCost.toLocaleString()} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>credits</span>
                    </span>
                </div>
                <p className="text-muted" style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem' }}>
                    You may pay less if the clearing price is lower than your max price
                </p>
            </div>

            {/* Submit Button */}
            <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-glow"
                disabled={isSubmitting || !wallet.connected}
                style={{ width: '100%', padding: 'var(--space-lg)' }}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        Submitting Bid...
                    </>
                ) : !wallet.connected ? (
                    'Connect Wallet to Bid'
                ) : (
                    'Place Bid'
                )}
            </motion.button>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </motion.form>
    );
}
