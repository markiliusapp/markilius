import { useState, useEffect } from "react";
import AuthHeader from '../../components/authHeader/AuthHeader';
import { authAPI } from '../../services/api'
import type { LoginUser } from "@/types";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import HeatmapMock from '../../components/heatmapMock/HeatmapMock';
import { MOCK_CELLS, MOCK_ARENAS } from '../../components/heatmapMock/mockData';
import './Login.css'
import { useAuth } from "@/context/authContext";
import { useDismissOnClick } from '@/hooks/useDismissOnClick';

const Login = () => {
    const { login } = useAuth()
    const [formData, setFormData] = useState<LoginUser>({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
    const [resendSent, setResendSent] = useState(false)
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [sessionExpired, setSessionExpired] = useState(searchParams.get('expired') === 'true');
    const accountDeleted = searchParams.get('deleted') === 'true';

    useDismissOnClick(() => {
        setError(null)
        setSessionExpired(false)
        setUnverifiedEmail(null)
        setResendSent(false)
    }, !!(error || sessionExpired || unverifiedEmail || resendSent))

    useEffect(() => {
        if (sessionExpired) {
            const timer = setTimeout(() => setSessionExpired(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setUnverifiedEmail(null)
        setResendSent(false)
        try {
            const data = await authAPI.login(formData)
            await login(data.access_token)
            navigate("/dashboard/year")
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            if (message.includes('Email not verified')) {
                setUnverifiedEmail(formData.email)
            } else if (message.includes('Rate limit exceeded') || message.includes('Too Many Requests')) {
                setError('Too many attempts. Wait a minute and try again.')
            } else {
                setError(message)
            }
        } finally {
            setLoading(false)
        }
    }

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError(null);
            try {
                const data = await authAPI.googleLogin({ access_token: tokenResponse.access_token });
                await login(data.access_token);
                navigate("/dashboard/year");
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Google login failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google login failed'),
    });

    return (
        <div className="login-page">
            {/* Brand */}
            <AuthHeader />

            {/* LEFT — Login form */}
            <div className="login-left">
                {/* Card */}
                <div className="login-card">
                    <h2 className="login-card-title">Welcome back</h2>
                    <p className="login-card-subtitle">Your record is waiting.</p>

                    {/* Account deleted */}
                    {accountDeleted && (
                        <div className="login-notice">
                            <p>Your account has been deleted.</p>
                        </div>
                    )}

                    {/* Session expired */}
                    {sessionExpired && !error && !accountDeleted && (
                        <div className="login-notice">
                            <p>Your session has expired. Sign in to continue.</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Unverified email banner */}
                    {unverifiedEmail && !resendSent && (
                        <div className="login-warning">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>
                                Email not verified.{' '}
                                <button
                                    type="button"
                                    className="login-resend-btn"
                                    onClick={async () => {
                                        try { await authAPI.resendVerification(unverifiedEmail) } catch { /* silent */ }
                                        setResendSent(true)
                                    }}
                                >
                                    Resend verification email
                                </button>
                            </p>
                        </div>
                    )}

                    {resendSent && (
                        <div className="login-success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <p>Verification email sent. Check your inbox.</p>
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="login-form">

                        <div className="form-field">
                            <label htmlFor="email">Email</label>
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
                            <div className="form-field-header">
                                <label htmlFor="password">Password</label>
                                <a href="/forgot-password" className="forgot-password">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Signing in...
                                </>
                            ) : 'Sign in'}
                        </button>

                    </form>

                    <p className="login-signup">
                        Don't have an account?{' '}
                        <a href="/register">Sign up</a>
                    </p>
                </div>

            </div>

            {/* RIGHT */}
            <div className="login-right">
                <div className="heatmap-wrapper">
                    <HeatmapMock
                        title="March 2026"
                        subtitle="74% consistent"
                        cells={MOCK_CELLS}
                        arenas={MOCK_ARENAS}
                    />
                </div>
                <div className="login-right-text">
                    <p className="login-right-quote">"You have power over your mind — not outside events. Realise this, and you will find strength."</p>
                    <span className="login-right-cite">— Marcus Aurelius</span>
                </div>
            </div>

        </div>
    )
}

export default Login
