'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, Loader2, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';
import { useRecords, Network } from '@puzzlehq/sdk';
import { RecordStatus } from '@puzzlehq/types';
import { parseBalanceRecord } from '@/services/balance';
import { CONTRACTS } from '@/services/aleo';

interface WithdrawFormProps {
    onSuccess?: () => void;
}

export default function WithdrawForm({ onSuccess }: WithdrawFormProps) {
    const { wallet, addNotification, setUserBalance, userBalance, addTransaction } = useStore();
    const [amount, setAmount] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

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

    const handleMaxClick = () => {
        setAmount(userBalance.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const withdrawAmount = parseInt(amount);
        if (!withdrawAmount || withdrawAmount <= 0) {
            addNotification({
                type: 'error',
                title: 'Invalid Amount',
                message: 'Please enter a valid withdrawal amount.',
            });
            return;
        }

        if (withdrawAmount > userBalance) {
            addNotification({
                type: 'error',
                title: 'Insufficient Balance',
                message: 'You cannot withdraw more than your available balance.',
            });
            return;
        }

        if (!wallet.connected) {
            addNotification({
                type: 'warning',
                title: 'Wallet Required',
                message: 'Please connect your wallet to withdraw.',
            });
            return;
        }

        if (balanceRecords.length === 0) {
            addNotification({
                type: 'warning',
                title: 'No Balance Records',
                message: 'No balance records found. Deposit credits first, then try again.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedRecord = selectBalanceRecord(withdrawAmount);
            if (!selectedRecord) {
                throw new Error('No balance record found with sufficient amount. Deposit more credits or consolidate balances.');
            }

            const result = await aleoWallet.withdraw('1field', withdrawAmount, selectedRecord);

            if (result.success) {
                setUserBalance(userBalance - withdrawAmount);
                addNotification({
                    type: 'success',
                    title: 'Withdrawal Successful!',
                    message: `${withdrawAmount.toLocaleString()} Aleo testnet credits have been sent to your wallet.`,
                });
                addTransaction({
                    type: 'withdraw',
                    amount: withdrawAmount,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    txHash: result.txId || '',
                });
                setAmount('');
                onSuccess?.();
            } else {
                throw new Error(result.error || 'Withdrawal failed');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Withdrawal Failed',
                message: error.message || 'Failed to withdraw. Please try again.',
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
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ArrowUpFromLine size={20} style={{ color: 'var(--color-error)' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Withdraw Tokens</h3>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Withdraw Aleo testnet credits back to your wallet
                    </span>
                </div>
            </div>

            {/* Warning */}
            {userBalance > 0 && (
                <div
                    className="flex items-center gap-md"
                    style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)',
                        fontSize: '0.875rem',
                    }}
                >
                    <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <span className="text-secondary">
                        Pending bids will be cancelled if you don't have enough balance
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Amount Input */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
                        <label className="text-muted" style={{
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Amount
                        </label>
                        <button
                            type="button"
                            onClick={handleMaxClick}
                            className="text-secondary"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                            }}
                        >
                            Max: {userBalance.toLocaleString()}
                        </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            className="input-glass"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min={1}
                            max={userBalance}
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

                {/* Remaining Balance Preview */}
                {amount && parseInt(amount) > 0 && (
                    <div
                        className="flex justify-between"
                        style={{
                            padding: 'var(--space-md)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.875rem',
                        }}
                    >
                        <span className="text-muted">Remaining Balance</span>
                        <span className="text-secondary">
                            {Math.max(0, userBalance - parseInt(amount)).toLocaleString()} credits
                        </span>
                    </div>
                )}

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    disabled={isSubmitting || !wallet.connected || !amount || parseInt(amount) > userBalance}
                    style={{
                        width: '100%',
                        padding: 'var(--space-md)',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            Processing...
                        </>
                    ) : !wallet.connected ? (
                        'Connect Wallet to Withdraw'
                    ) : parseInt(amount) > userBalance ? (
                        'Insufficient Balance'
                    ) : (
                        <>
                            <ArrowUpFromLine size={20} />
                            Withdraw {amount ? `${parseInt(amount).toLocaleString()} Credits` : ''}
                        </>
                    )}
                </motion.button>
            </form>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </motion.div>
    );
}
