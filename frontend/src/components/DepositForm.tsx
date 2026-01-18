'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { useWallet } from '@/contexts/WalletContext';
import { useRecords } from '@puzzlehq/sdk';
import { aleoWallet } from '@/services/wallet';
import { getRecords, Network } from '@puzzlehq/sdk-core';

interface DepositFormProps {
    onSuccess?: () => void;
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
    const { wallet, addNotification, setUserBalance, userBalance, addTransaction } = useStore();
    const { connected } = useWallet();
    const [amount, setAmount] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isCreatingRecord, setIsCreatingRecord] = React.useState(false);
    const [creditsRecords, setCreditsRecords] = React.useState<any[]>([]);
    const [creditsLoading, setCreditsLoading] = React.useState(false);

    const presetAmounts = [100, 500, 1000, 5000];

    // Fetch credits records from Puzzle wallet when connected
    // @ts-ignore - useRecords hook from Puzzle SDK
    const creditsRecordsResult = useRecords(
        connected ? {
            filter: {
                programIds: ['credits.aleo'],
                names: ['credits'],
                status: 'Unspent'
            },
            network: Network.AleoTestnet
        } : {
            filter: {
                programIds: [],
                names: [],
                status: 'Unspent'
            },
            network: Network.AleoTestnet
        }
    );

    const getRecordText = (record: any): string => {
        if (typeof record === 'string') return record;
        if (record?.record && typeof record.record === 'string') return record.record;
        if (record?.plaintext && typeof record.plaintext === 'string') return record.plaintext;
        return JSON.stringify(record);
    };

    const parseCreditsRecord = (record: any): number => {
        if (record?.plaintext?.microcredits) {
            const micro = record.plaintext.microcredits.toString().replace('u64', '');
            return parseInt(micro, 10) || 0;
        }
        if (record?.record?.microcredits) {
            const micro = record.record.microcredits.toString().replace('u64', '');
            return parseInt(micro, 10) || 0;
        }
        const recordStr = getRecordText(record);
        const microMatch = recordStr.match(/microcredits:\s*(\d+)u64/i);
        if (!microMatch) return 0;
        return parseInt(microMatch[1], 10) || 0;
    };

    const creditsRecordsFromHook = creditsRecordsResult?.records || [];
    const creditsRecordsLoading = creditsRecordsResult?.loading || false;
    const availableMicrocredits = creditsRecords.reduce((sum, record) => sum + parseCreditsRecord(record), 0);
    const availableCredits = Math.floor(availableMicrocredits / 1000000);

    const selectCreditsRecord = (records: any[], microcreditsNeeded: number): any | null => {
        for (const record of records) {
            const micro = parseCreditsRecord(record);
            if (micro >= microcreditsNeeded) {
                return record;
            }
        }
        return null;
    };

    const fetchCreditsRecords = async (): Promise<any[]> => {
        if (!wallet.address) return [];
        const fetchAllPages = async (filter: any): Promise<any[]> => {
            let page = 0;
            const all: any[] = [];
            while (true) {
                const response = await getRecords({
                    filter,
                    address: wallet.address,
                    network: Network.AleoTestnet,
                    page,
                });
                all.push(...(response?.records || []));
                const pageCount = response?.pageCount ?? 0;
                if (pageCount === 0 || page + 1 >= pageCount) break;
                page += 1;
            }
            return all;
        };

        // 1) strict filter
        let records = await fetchAllPages({
            programIds: ['credits.aleo'],
            names: ['credits'],
            status: 'Unspent',
        });

        // 2) fallback without names
        if (records.length === 0) {
            records = await fetchAllPages({
                programIds: ['credits.aleo'],
                status: 'Unspent',
            });
        }

        // 3) fallback to all unspent, then filter locally
        if (records.length === 0) {
            const all = await fetchAllPages({
                status: 'Unspent',
            });
            records = all.filter((record) => {
                const recordStr = getRecordText(record);
                return recordStr.includes('credits.aleo') || recordStr.includes('microcredits');
            });
        }

        return records;
    };

    React.useEffect(() => {
        if (!connected || !wallet.address) {
            setCreditsRecords([]);
            setCreditsLoading(false);
            return;
        }

        // Prefer the SDK hook if it returns records
        if (creditsRecordsFromHook.length > 0) {
            setCreditsRecords(creditsRecordsFromHook);
            setCreditsLoading(false);
            return;
        }

        // Wait for hook to finish loading before fallback fetch
        if (creditsRecordsLoading) return;

        let cancelled = false;
        setCreditsLoading(true);
        fetchCreditsRecords()
            .then((records) => {
                if (!cancelled) setCreditsRecords(records);
            })
            .catch(() => {
                if (!cancelled) setCreditsRecords([]);
            })
            .finally(() => {
                if (!cancelled) setCreditsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [connected, wallet.address, creditsRecordsFromHook.length, creditsRecordsLoading]);

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
            const microcreditsNeeded = depositAmount * 1000000;
            let workingRecords = await fetchCreditsRecords();
            let attemptedCreate = false;

            let selectedRecord = selectCreditsRecord(workingRecords, microcreditsNeeded);
            if (!selectedRecord && !attemptedCreate) {
                setIsCreatingRecord(true);
                addNotification({
                    type: 'info',
                    title: 'Creating Credits Record',
                    message: 'Creating a private credits record from your public balance...',
                });

                const createResult = await aleoWallet.createPrivateCredits(depositAmount);
                if (!createResult.success) {
                    throw new Error(createResult.error || 'Failed to create private credits record');
                }
                attemptedCreate = true;

                await new Promise(resolve => setTimeout(resolve, 2000));
                workingRecords = await fetchCreditsRecords();
                selectedRecord = selectCreditsRecord(workingRecords, microcreditsNeeded);
            }
            if (!selectedRecord) {
                const maxMicro = workingRecords.reduce((max, record) => {
                    const micro = parseCreditsRecord(record);
                    return micro > max ? micro : max;
                }, 0);
                const maxCredits = Math.floor(maxMicro / 1000000);
                throw new Error(
                    maxCredits > 0
                        ? `No credits record large enough. Largest record: ${maxCredits} credits. Try a smaller amount or consolidate.`
                        : 'No credits record found with sufficient balance. Create or consolidate credits, then try again.'
                );
            }

            const result = await aleoWallet.deposit('1field', depositAmount, selectedRecord);

            if (result.success) {
                // setUserBalance(userBalance + depositAmount); // Removed optimistic update
                addNotification({
                    type: 'success',
                    title: 'Deposit Successful!',
                    message: `${depositAmount.toLocaleString()} Aleo testnet credits have been deposited to your internal balance.`,
                });
                addTransaction({
                    type: 'deposit',
                    amount: depositAmount,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    txHash: result.txId || '',
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
            setIsCreatingRecord(false);
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
                        Deposit real Aleo testnet credits to your internal balance
                    </span>
                </div>
            </div>

            {!wallet.connected && (
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
                    <span className="text-warning">
                        ⚠️ Connect your Puzzle or Leo wallet to deposit real Aleo testnet tokens
                    </span>
                </div>
            )}

            {wallet.connected && (
                <div
                    className="text-muted"
                    style={{ fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}
                >
                    {creditsLoading
                        ? 'Fetching credits records...'
                        : `Credits records found: ${creditsRecords.length} · Private credits available: ${availableCredits.toLocaleString()}`}
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
                            Amount (Aleo Credits)
                        </label>
                        <button
                            type="button"
                            onClick={() => setAmount(availableCredits.toString())}
                            className="text-secondary"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                            }}
                            disabled={availableCredits <= 0}
                        >
                            Max: {availableCredits.toLocaleString()}
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
                    disabled={isSubmitting || isCreatingRecord || !wallet.connected || !amount}
                    style={{
                        width: '100%',
                        padding: 'var(--space-md)',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                    }}
                >
                    {isSubmitting || isCreatingRecord ? (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ display: 'inline-block' }}
                            >
                                <Loader2 size={20} />
                            </motion.span>
                            {isCreatingRecord ? 'Preparing Credits Record...' : 'Transferring Aleo Credits...'}
                        </>
                    ) : !wallet.connected ? (
                        'Connect Wallet to Deposit'
                    ) : (
                        <>
                            <ArrowDownToLine size={20} />
                            Deposit {amount ? `${parseInt(amount).toLocaleString()} Aleo Credits` : ''}
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}

