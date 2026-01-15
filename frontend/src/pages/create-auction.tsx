'use client';
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
    Plus,
    Loader2,
    HelpCircle,
    Calendar,
    DollarSign,
    Package,
    ArrowRight,
    ArrowLeft,
    Check
} from 'lucide-react';
import { useStore } from '@/store';
import { aleoWallet } from '@/services/wallet';

export default function CreateAuctionPage() {
    const router = useRouter();
    const { wallet, addNotification } = useStore();
    const [step, setStep] = React.useState(1);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [formData, setFormData] = React.useState({
        itemName: '',
        itemDescription: '',
        totalSupply: 100,
        startPrice: 10000,
        reservePrice: 1000,
        duration: 24, // hours
        startDelay: 1, // hours from now
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (stepNum: number): boolean => {
        switch (stepNum) {
            case 1:
                return formData.itemName.length >= 3 && formData.itemDescription.length >= 10;
            case 2:
                return formData.totalSupply > 0 && formData.startPrice > formData.reservePrice && formData.reservePrice > 0;
            case 3:
                return formData.duration >= 1 && formData.startDelay >= 0;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        } else {
            addNotification({
                type: 'warning',
                title: 'Incomplete Step',
                message: 'Please fill in all required fields correctly.',
            });
        }
    };

    const handleSubmit = async () => {
        if (!wallet.connected) {
            addNotification({
                type: 'warning',
                title: 'Wallet Required',
                message: 'Please connect your wallet to create an auction.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const now = Date.now();
            const startTime = now + (formData.startDelay * 60 * 60 * 1000);
            const endTime = startTime + (formData.duration * 60 * 60 * 1000);

            const result = await aleoWallet.createAuction(
                formData.itemName,
                formData.itemDescription,
                formData.totalSupply,
                formData.startPrice,
                formData.reservePrice,
                Math.floor(startTime / 1000),
                Math.floor(endTime / 1000)
            );

            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Auction Created!',
                    message: 'Your auction has been submitted to the blockchain.',
                });
                router.push('/');
            } else {
                throw new Error(result.error || 'Failed to create auction');
            }
        } catch (error: any) {
            addNotification({
                type: 'error',
                title: 'Creation Failed',
                message: error.message || 'Failed to create auction. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { num: 1, title: 'Item Details', icon: Package },
        { num: 2, title: 'Pricing', icon: DollarSign },
        { num: 3, title: 'Schedule', icon: Calendar },
        { num: 4, title: 'Review', icon: Check },
    ];

    return (
        <>
            <Head>
                <title>Create Auction - EquiClear</title>
            </Head>

            <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)', maxWidth: '800px' }}>
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                    style={{ marginBottom: 'var(--space-2xl)' }}
                >
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-lg)',
                        }}
                    >
                        <Plus size={32} color="white" />
                    </div>
                    <h1>Create Dutch Auction</h1>
                    <p className="text-secondary">
                        Set up a new auction with privacy-preserving bidding
                    </p>
                </motion.div>

                {/* Step Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between"
                    style={{ marginBottom: 'var(--space-2xl)', position: 'relative' }}
                >
                    {/* Progress Line */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '40px',
                            right: '40px',
                            height: '2px',
                            background: 'var(--glass-border)',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                background: 'var(--color-primary)',
                                width: `${((step - 1) / 3) * 100}%`,
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </div>

                    {steps.map((s) => (
                        <div
                            key={s.num}
                            className="flex flex-col items-center"
                            style={{ position: 'relative', zIndex: 1 }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: step >= s.num
                                        ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                                        : 'var(--glass-bg)',
                                    border: step >= s.num ? 'none' : '2px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <s.icon size={18} color={step >= s.num ? 'white' : 'var(--text-muted)'} />
                            </div>
                            <span
                                className={step >= s.num ? 'text-primary' : 'text-muted'}
                                style={{ fontSize: '0.75rem', marginTop: 'var(--space-sm)' }}
                            >
                                {s.title}
                            </span>
                        </div>
                    ))}
                </motion.div>

                {/* Form Steps */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card"
                    style={{ padding: 'var(--space-xl)' }}
                >
                    {step === 1 && (
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Item Details</h3>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    value={formData.itemName}
                                    onChange={(e) => updateField('itemName', e.target.value)}
                                    placeholder="e.g., Rare NFT Collection"
                                    maxLength={50}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Description *
                                </label>
                                <textarea
                                    className="input-glass"
                                    value={formData.itemDescription}
                                    onChange={(e) => updateField('itemDescription', e.target.value)}
                                    placeholder="Describe what you're auctioning..."
                                    rows={4}
                                    style={{ resize: 'vertical', minHeight: '100px' }}
                                />
                            </div>

                            <div>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Total Supply *
                                </label>
                                <input
                                    type="number"
                                    className="input-glass"
                                    value={formData.totalSupply}
                                    onChange={(e) => updateField('totalSupply', parseInt(e.target.value) || 0)}
                                    min={1}
                                    max={10000}
                                />
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Number of items available in this auction
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Pricing</h3>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Starting Price (per item) *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="input-glass"
                                        value={formData.startPrice}
                                        onChange={(e) => updateField('startPrice', parseInt(e.target.value) || 0)}
                                        min={1}
                                        style={{ paddingRight: '80px' }}
                                    />
                                    <span className="text-muted" style={{ position: 'absolute', right: 'var(--space-lg)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem' }}>
                                        credits
                                    </span>
                                </div>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Price will start at this level and decrease over time
                                </span>
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Reserve Price (per item) *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="input-glass"
                                        value={formData.reservePrice}
                                        onChange={(e) => updateField('reservePrice', parseInt(e.target.value) || 0)}
                                        min={1}
                                        max={formData.startPrice - 1}
                                        style={{ paddingRight: '80px' }}
                                    />
                                    <span className="text-muted" style={{ position: 'absolute', right: 'var(--space-lg)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem' }}>
                                        credits
                                    </span>
                                </div>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Minimum price - auction won't go below this
                                </span>
                            </div>

                            {/* Price Visualization */}
                            <div
                                className="glass-card"
                                style={{
                                    padding: 'var(--space-lg)',
                                    background: 'rgba(99, 102, 241, 0.05)',
                                    marginTop: 'var(--space-xl)'
                                }}
                            >
                                <div className="flex justify-between text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-sm)' }}>
                                    <span>Start: {formData.startPrice.toLocaleString()}</span>
                                    <span>Reserve: {formData.reservePrice.toLocaleString()}</span>
                                </div>
                                <div className="progress-bar" style={{ height: '8px' }}>
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${Math.max(0, Math.min(100, ((formData.startPrice - formData.reservePrice) / formData.startPrice) * 100))}%`
                                        }}
                                    />
                                </div>
                                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 'var(--space-md)', textAlign: 'center' }}>
                                    Price will decrease by {((formData.startPrice - formData.reservePrice) / formData.startPrice * 100).toFixed(0)}% from start to reserve
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Schedule</h3>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Start Delay (hours from now)
                                </label>
                                <input
                                    type="number"
                                    className="input-glass"
                                    value={formData.startDelay}
                                    onChange={(e) => updateField('startDelay', parseFloat(e.target.value) || 0)}
                                    min={0}
                                    max={168}
                                    step={0.5}
                                />
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Set to 0 to start immediately
                                </span>
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}>
                                    Duration (hours)
                                </label>
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                                    {[1, 6, 12, 24, 48, 72].map((hours) => (
                                        <motion.button
                                            key={hours}
                                            type="button"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`btn ${formData.duration === hours ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => updateField('duration', hours)}
                                            style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.875rem' }}
                                        >
                                            {hours}h
                                        </motion.button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    className="input-glass"
                                    value={formData.duration}
                                    onChange={(e) => updateField('duration', parseFloat(e.target.value) || 1)}
                                    min={1}
                                    max={168}
                                    step={0.5}
                                />
                            </div>

                            {/* Timeline Preview */}
                            <div
                                className="glass-card"
                                style={{ padding: 'var(--space-lg)', background: 'rgba(34, 211, 238, 0.05)' }}
                            >
                                <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>Timeline Preview</h4>
                                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                    <p style={{ margin: '0 0 var(--space-sm) 0' }}>
                                        <strong>Starts:</strong> {new Date(Date.now() + formData.startDelay * 3600000).toLocaleString()}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <strong>Ends:</strong> {new Date(Date.now() + (formData.startDelay + formData.duration) * 3600000).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Review & Confirm</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <ReviewItem label="Item Name" value={formData.itemName} />
                                <ReviewItem label="Description" value={formData.itemDescription} />
                                <ReviewItem label="Total Supply" value={`${formData.totalSupply} items`} />
                                <ReviewItem label="Starting Price" value={`${formData.startPrice.toLocaleString()} credits`} />
                                <ReviewItem label="Reserve Price" value={`${formData.reservePrice.toLocaleString()} credits`} />
                                <ReviewItem label="Duration" value={`${formData.duration} hours`} />
                                <ReviewItem
                                    label="Starts At"
                                    value={new Date(Date.now() + formData.startDelay * 3600000).toLocaleString()}
                                />
                            </div>

                            <div
                                className="flex items-center gap-md"
                                style={{
                                    marginTop: 'var(--space-xl)',
                                    padding: 'var(--space-md)',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <HelpCircle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                    Creating an auction requires a transaction fee. Make sure you have enough testnet credits.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between" style={{ marginTop: 'var(--space-xl)' }}>
                        {step > 1 ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-secondary"
                                onClick={() => setStep(step - 1)}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </motion.button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                Next
                                <ArrowRight size={18} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-primary btn-glow"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !wallet.connected}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                        Creating...
                                    </>
                                ) : !wallet.connected ? (
                                    'Connect Wallet'
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Create Auction
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
    return (
        <div
            className="flex justify-between"
            style={{
                padding: 'var(--space-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
            }}
        >
            <span className="text-muted">{label}</span>
            <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{value}</span>
        </div>
    );
}
