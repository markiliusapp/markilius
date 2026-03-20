import { useEffect } from 'react';
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
        const activate = async () => {
            if (sessionId) {
                await paymentAPI.verifySession(sessionId);
            }
            await refreshUser();
            navigate('/dashboard');
        };
        activate();
    }, []);

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="login-brand-name">Checkly</span>
                </div>
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
                        <h2 className="login-card-title">Payment successful!</h2>
                        <p className="login-card-subtitle">Welcome to Checkly. Taking you to your dashboard...</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="spinner" />
                    </div>
                </div>
            </div>
            <div className="login-right">
                <div className="login-right-text">
                    <h3>You're all set</h3>
                    <p>Start building habits that stick.</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
