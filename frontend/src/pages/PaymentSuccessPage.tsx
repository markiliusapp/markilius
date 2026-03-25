import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { paymentAPI } from '../services/api';
import type { User } from '../types';
import BrandLogo from '../components/brandLogo/BrandLogo';
import '../pages/login/Login.css';
import './PaymentSuccess.css';

const PaymentSuccessPage = () => {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [ready, setReady] = useState(false);
    const [resolvedUser, setResolvedUser] = useState<User | null>(null);

    const isUpgrade = searchParams.get('upgrade') === '1';

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const activate = async () => {
            if (sessionId) {
                await paymentAPI.verifySession(sessionId);
            }
            const updatedUser = await refreshUser();
            setResolvedUser(updatedUser ?? null);
            setReady(true);
        };
        activate();
    }, []);

    const isFirstPurchase = ready && !isUpgrade && !resolvedUser?.onboarding_completed;

    const title = isUpgrade
        ? "You're on Lifetime."
        : isFirstPurchase
            ? "You're in."
            : "Welcome back.";

    const subtitle = isUpgrade
        ? "Your record continues. No renewals, ever."
        : isFirstPurchase
            ? "This is your record. It starts today."
            : "Your record continues.";

    const ctaLabel = isFirstPurchase ? "Set up your arenas" : "Go to dashboard";

    const handleCta = () => {
        if (isFirstPurchase) {
            navigate('/onboarding');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="payment-success-page">
            <div className="payment-success-header">
                <BrandLogo size="sm" />
            </div>

            <div className="payment-success-card">
                {!ready ? (
                    <div className="payment-success-loading">
                        <div className="spinner" />
                        <p>Confirming your payment...</p>
                    </div>
                ) : (
                    <>
                        <div className="payment-success-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 className="payment-success-title">{title}</h1>
                        <p className="payment-success-subtitle">{subtitle}</p>
                        <button className="payment-success-btn" onClick={handleCta}>
                            {ctaLabel}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
