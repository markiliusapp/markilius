import { useState } from "react";
import { useDismissOnClick } from '@/hooks/useDismissOnClick';
import AuthHeader from '../../components/authHeader/AuthHeader';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { RegisterUser} from "@/types";
import { useGoogleLogin } from "@react-oauth/google";
import HeatmapMock from '../../components/heatmapMock/HeatmapMock';
import { MOCK_CELLS, MOCK_ARENAS } from '../../components/heatmapMock/mockData';
import '../login/Login.css';
import './Register.css';
import { useAuth } from "@/context/authContext";

const RightPanel = () => (
    <div className="register-right">
        <div className="heatmap-wrapper">
            <HeatmapMock
                title="Your record"
                subtitle="starts today"
                cells={MOCK_CELLS}
                arenas={MOCK_ARENAS}
            />
        </div>
        <div className="login-right-text">
            <p className="login-right-quote">This is your record. It starts today.</p>
            <span className="login-right-cite">— Markilius</span>
        </div>
    </div>
);


const RegisterPage = () => {
    const { login } = useAuth()
    const [formData, setFormData] = useState<RegisterUser>({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [resendSent, setResendSent] = useState(false);
    const navigate = useNavigate();

    useDismissOnClick(() => setError(null), !!error)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authAPI.register(formData);
            setRegistered(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError(null);
            try {
                const data = await authAPI.googleLogin({ access_token: tokenResponse.access_token });
                await login(data.access_token);
                navigate("/dashboard");
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Google login failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google login failed'),
    });

    if (registered) {
        return (
            <div className="register-page">
                <div className="register-left">
                    <AuthHeader />
                    <div className="login-card">
                        <h2 className="login-card-title">Check your email</h2>
                        <p className="login-card-subtitle">
                            We sent a verification link to <strong>{formData.email}</strong>.
                            Click it to activate your account.
                        </p>
                        {!resendSent ? (
                            <p className="login-resend-hint">
                                Didn't receive it?{' '}
                                <button
                                    type="button"
                                    className="login-resend-btn"
                                    onClick={async () => {
                                        try { await authAPI.resendVerification(formData.email); } catch { /* silent */ }
                                        setResendSent(true);
                                    }}
                                >
                                    Resend email
                                </button>
                            </p>
                        ) : (
                            <div className="login-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <p>Verification email sent. Check your inbox.</p>
                            </div>
                        )}
                        <p style={{ marginTop: '16px', fontSize: '14px' }}>
                            <a href="/login" style={{ color: '#f97316' }}>Back to sign in</a>
                        </p>
                    </div>
                </div>
                <RightPanel />
            </div>
        );
    }

    return (
        <div className="register-page">
            <div className="register-left">
                <AuthHeader />
                <div className="login-card">
                    <h2 className="login-card-title">Start your record.</h2>
                    <p className="login-card-subtitle">Your record starts the moment you do.</p>

                    {error && (
                        <div className="login-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    <button type="button" className="google-btn" onClick={() => googleLogin()} disabled={loading}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <form onSubmit={handleSubmit} className="login-form">

                        <div className="form-field">
                            <label htmlFor="first_name">First Name</label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="Marcus"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="last_name">Last Name</label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                placeholder="Aurelius"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="email">Email <span style={{color: '#dc2626'}}>*</span></label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={10}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Creating account...
                                </>
                            ) : 'Create Account'}
                        </button>

                    </form>

                    <p className="login-signup">
                        Already have an account?{' '}
                        <a href="/login">Sign in</a>
                    </p>
                </div>
            </div>

            <RightPanel />
        </div>
    );
};

export default RegisterPage;
