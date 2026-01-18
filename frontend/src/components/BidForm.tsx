'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';
import { useRecords, Network } from '@puzzlehq/sdk';
import { RecordStatus } from '@puzzlehq/types';
import { parseBalanceRecord } from '@/services/balance';
import { CONTRACTS } from '@/services/aleo';

interface BidFormProps {
    auctionId: string;
    currentPrice: number;
    remainingSupply: number;
    onSuccess?: () => void;
}

export default function BidForm({ auctionId, currentPrice, remainingSupply, onSuccess }: BidFormProps) {
    const { wallet, addNotification, userBalance } = useStore();
    const [quantity, setQuantity] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const qty = parseInt(quantity) || 0;
    const totalCost = qty > 0 ? qty * currentPrice : 0;
    const insufficientBalance = totalCost > userBalance;
    const maxQuantity = Math.max(0, remainingSupply);

    // Fetch balance records from Puzzle wallet when connected
    // @ts-ignore - useRecords hook from Puzzle SDK
    const balanceRecordsResult = useRecords(
        wallet.connected ? {
            filter: {
                programIds: [CONTRACTS.BALANCE],
                names: ['Balance'],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        } : {
            filter: {
                programIds: [],
                names: [],
                status: RecordStatus.Unspent
            },
            network: Network.AleoTestnet
        }
    );

    const balanceRecords = balanceRecordsResult?.records || [];

    const getRecordText = (record: any): string => {
        if (typeof record === 'string') return record;
        if (record?.record && typeof record.record === 'string') return record.record;
        if (record?.plaintext && typeof record.plaintext === 'string') return record.plaintext;
        return JSON.stringify(record);
    };

    const selectBalanceRecord = (neededAmount: number): string | null => {
        for (const record of balanceRecords) {
            const recordStr = getRecordText(record);
            const parsed = parseBalanceRecord(recordStr);
            if (!parsed) continue;
            const recordTokenId = parsed.token_id?.toString() || '';
            const tokenMatches = recordTokenId.includes('1field') || recordTokenId === '1';
            const amountStr = parsed.amount.toString().replace('u64', '');
            const amountValue = parseInt(amountStr, 10) || 0;
            if (tokenMatches && amountValue >= neededAmount) {
                return recordStr;
            }
        }
        return null;
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

        if (!qty || qty <= 0) {
            addNotification({
                type: 'error',
                title: 'Invalid Quantity',
                message: 'Please enter a valid quantity of items to bid for.',
            });
            return;
        }

        if (qty > maxQuantity) {
            addNotification({
                type: 'error',
                title: 'Quantity Too High',
                message: 'You cannot bid for more items than the remaining supply.',
            });
            return;
        }

        if (insufficientBalance || totalCost <= 0) {
            addNotification({
                type: 'error',
                title: 'Insufficient Balance',
                message: 'Your internal balance is not enough for this bid.',
            });
            return;
        }

        if (balanceRecords.length === 0) {
            addNotification({
                type: 'warning',
                title: 'No Balance Records',
                message: 'No balance records found. Deposit credits before placing a bid.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedRecord = selectBalanceRecord(totalCost);
            if (!selectedRecord) {
                throw new Error('No balance record found with sufficient amount. Deposit more credits or consolidate balances.');
            }

            const result = await aleoWallet.placeBid(auctionId, qty, currentPrice, selectedRecord);

            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Bid Submitted!',
                    message: `Bid placed for ${qty.toLocaleString()} item(s) at ${currentPrice.toLocaleString()} Aleo credits each. Amount deducted from your balance.`,
                });
                setQuantity('');
                onSuccess?.();
            } else {
                throw new Error(result.error || 'Bid failed');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Bid Failed',
                message: error.message || 'Failed to place bid. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const disabled =
        isSubmitting ||
        !wallet.connected ||
        qty <= 0 ||
        totalCost <= 0 ||
        insufficientBalance ||
        maxQuantity <= 0;

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
                        background: 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <TrendingDown size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Place Bid</h3>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Place a bid using your Aleo testnet credits balance
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label
                        className="text-muted"
                        style={{
                            display: 'block',
                            marginBottom: 'var(--space-sm)',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Quantity
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            className="input-glass"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Number of items"
                            min={1}
                            max={maxQuantity || undefined}
                            style={{ paddingRight: '100px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setQuantity(maxQuantity.toString())}
                            className="text-secondary"
                            style={{
                                position: 'absolute',
                                right: 'var(--space-lg)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}
                            disabled={maxQuantity <= 0}
                        >
                            Max: {maxQuantity}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)', fontSize: '0.875rem' }}>
                        <span className="text-muted">Price per item</span>
                        <span className="text-secondary">{currentPrice.toLocaleString()} credits</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '0.875rem' }}>
                        <span className="text-muted">Total cost</span>
                        <span
                            className="text-secondary"
                            style={{
                                color: insufficientBalance ? 'var(--color-error)' : 'var(--text-secondary)',
                                fontWeight: 600,
                            }}
                        >
                            {totalCost > 0 ? totalCost.toLocaleString() : '-'} credits
                        </span>
                    </div>
                    <div className="flex justify-between" style={{ marginTop: 'var(--space-xs)', fontSize: '0.75rem' }}>
                        <span className="text-muted">Your balance</span>
                        <span className="text-secondary">{userBalance.toLocaleString()} credits</span>
                    </div>
                </div>

                <motion.button
                    type="submit"
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                    className="btn btn-primary btn-glow"
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: 'var(--space-md)',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            Submitting Bid...
                        </>
                    ) : !wallet.connected ? (
                        'Connect Wallet to Bid'
                    ) : insufficientBalance ? (
                        'Insufficient Balance'
                    ) : maxQuantity <= 0 ? (
                        'No Items Available'
                    ) : qty <= 0 ? (
                        'Enter Quantity'
                    ) : (
                        <>
                            Place Bid for {qty} item{qty === 1 ? '' : 's'}
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}