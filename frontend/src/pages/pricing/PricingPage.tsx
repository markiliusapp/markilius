import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/authContext';
import BrandLogo from '../../components/brandLogo/BrandLogo';
import './Pricing.css';

const PLANS = [
    {
        id: 'monthly' as const,
        name: 'Monthly',
        price: '$2.99',
        period: '/ month',
        subtext: 'Billed monthly',
        highlight: false,
    },
    {
        id: 'yearly' as const,
        name: 'Yearly',
        price: '$19.99',
        period: '/ year',
        subtext: 'Just $1.67 / month — save 44%',
        highlight: true,
    },
    {
        id: 'lifetime' as const,
        name: 'Lifetime',
        price: '$39.99',
        period: 'one-time',
        subtext: 'Pay once, own it forever',
        highlight: false,
    },
];

const FEATURES = [
    'Unlimited arenas',
    'Unlimited tasks',
    'Recurring tasks',
    'Productivity stats (daily, weekly, monthly, yearly)',
    'Heatmaps',
    'Streak tracking',
    'Weekly email summaries',
    'Public profile',
];

const PricingPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const currentTier = user?.subscription_tier;
    const isActive = user?.subscription_status === 'active';
    const isLifetime = user?.subscription_status === 'lifetime';

    const getButtonLabel = (planId: 'monthly' | 'yearly' | 'lifetime') => {
        if (isLifetime) return 'Current plan';
        if (currentTier === planId && isActive) return 'Current plan';
        if (planId === 'monthly' && isActive) return 'Downgrade not available';
        if (planId === 'yearly' && currentTier === 'yearly' && isActive) return 'Current plan';
        if (planId === 'lifetime' && isActive) return 'Upgrade to Lifetime';
        return 'Get started';
    };

    const isDisabled = (planId: 'monthly' | 'yearly' | 'lifetime') => {
        if (loadingPlan !== null) return true;
        if (isLifetime) return true;
        if (currentTier === planId && isActive) return true;
        if (planId === 'monthly' && isActive) return true;
        if (planId === 'yearly' && currentTier === 'yearly') return true;
        return false;
    };

    const handleSelect = async (plan: 'monthly' | 'yearly' | 'lifetime') => {
        if (isDisabled(plan)) return;
        setLoadingPlan(plan);
        setError(null);
        try {
            if (plan === 'lifetime' && isActive) {
                const { url } = await paymentAPI.upgradeToLifetime();
                window.location.href = url;
            } else if (plan === 'yearly' && isActive) {
                // Monthly → Yearly: use Stripe billing portal
                const { url } = await paymentAPI.createPortalSession();
                window.location.href = url;
            } else {
                const { url } = await paymentAPI.createCheckoutSession(plan);
                window.location.href = url;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="pricing-page">
            {/* Header */}
            <div className="pricing-header">
                <div className="pricing-brand">
                    <BrandLogo size="md" />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {(isActive || isLifetime) && (
                        <button className="pricing-logout" onClick={() => navigate('/dashboard')}>Go to dashboard</button>
                    )}
                    <button className="pricing-logout" onClick={logout}>Sign out</button>
                </div>
            </div>

            <div className="pricing-content">
                <h1 className="pricing-title">
                    {isActive || isLifetime ? 'Manage your plan' : 'Start building better habits'}
                </h1>
                <p className="pricing-subtitle">
                    {isActive || isLifetime ? 'You can upgrade your plan below.' : 'Choose a plan that works for you. Cancel anytime.'}
                </p>

                {error && (
                    <div className="pricing-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                {/* Plan cards */}
                <div className="pricing-cards">
                    {PLANS.map(plan => (
                        <div key={plan.id} className={`pricing-card ${plan.highlight ? 'pricing-card-highlight' : ''}`}>
                            {plan.highlight && <div className="pricing-badge">Most popular</div>}
                            <div className="pricing-card-name">{plan.name}</div>
                            <div className="pricing-card-price">
                                <span className="pricing-card-amount">{plan.price}</span>
                                <span className="pricing-card-period">{plan.period}</span>
                            </div>
                            <div className="pricing-card-subtext">{plan.subtext}</div>
                            <button
                                className={`pricing-card-btn ${plan.highlight ? 'pricing-card-btn-highlight' : ''}`}
                                onClick={() => handleSelect(plan.id)}
                                disabled={isDisabled(plan.id)}
                            >
                                {loadingPlan === plan.id ? (
                                    <><div className="spinner" />Processing...</>
                                ) : getButtonLabel(plan.id)}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Features list */}
                <div className="pricing-features">
                    <p className="pricing-features-title">Everything includes:</p>
                    <ul className="pricing-features-list">
                        {FEATURES.map(f => (
                            <li key={f}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
