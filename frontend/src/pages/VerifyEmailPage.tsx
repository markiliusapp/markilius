import { useEffect, useState } from 'react';
import AuthHeader from '../components/authHeader/AuthHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/authContext';
import './login/Login.css';

const VerifyEmailPage = () => {
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('No verification token found.');
            return;
        }

        authAPI.verifyEmail(token)
            .then(async (data) => {
                await login(data.access_token);
                navigate('/pricing');
            })
            .catch((err: Error) => {
                setStatus('error');
                setMessage(err.message || 'Verification failed.');
            });
    }, [searchParams]);

    return (
        <div className="login-page">
            <div className="login-left">
                <AuthHeader />

                <div className="login-card">
                    {status === 'loading' && (
                        <>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p className="login-card-subtitle">Verifying your email...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <h2 className="login-card-title">Email verified!</h2>
                            <p className="login-card-subtitle">Your account is now active.</p>
                            <button
                                className="login-button"
                                style={{ marginTop: '24px' }}
                                onClick={() => navigate('/login')}
                            >
                                Sign in
                            </button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h2 className="login-card-title">Verification failed</h2>
                            <p className="login-card-subtitle">{message}</p>
                            <p style={{ marginTop: '16px', fontSize: '14px' }}>
                                <a href="/login" style={{ color: '#f97316' }}>Back to sign in</a>
                            </p>
                        </>
                    )}
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

export default VerifyEmailPage;
