import { useEffect } from 'react';
import AuthHeader from '../components/authHeader/AuthHeader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { paymentAPI } from '../services/api';
import '../pages/login/Login.css';

const PaymentSuccessPage = () => {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const isUpgrade = searchParams.get('upgrade') === '1';
        const activate = async () => {
            if (sessionId) {
                await paymentAPI.verifySession(sessionId);
            }
            await refreshUser();
            navigate(isUpgrade ? '/pricing?upgraded=true' : '/onboarding');
        };
        activate();
    }, []);

    return (
        <div className="login-page">
            <div className="login-left">
                <AuthHeader />
                <div className="login-card">
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: '#f0fdf4', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 16px'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="login-card-title">You're in.</h2>
                        <p className="login-card-subtitle">Setting up your arenas...</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="spinner" />
                    </div>
                </div>
            </div>
            <div className="login-right">
                <div className="login-right-text">
                    <p className="login-right-quote">This is your record. It starts today.</p>
                    <span className="login-right-cite">— Markilius</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
