import { useState } from "react";
import AuthHeader from '../../components/authHeader/AuthHeader';
import { authAPI } from '../../services/api'
import type { LoginUser } from "@/types";
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import HeatmapMock from '../../components/heatmapMock/HeatmapMock';
import { MOCK_CELLS, MOCK_ARENAS } from '../../components/heatmapMock/mockData';
import './Login.css'
import { useAuth } from "@/context/authContext";

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
            navigate("/dashboard")
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            if (message.includes('Email not verified')) {
                setUnverifiedEmail(formData.email)
            } else {
                setError(message)
            }
        } finally {
            setLoading(false)
        }
    }
    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authAPI.googleLogin(credentialResponse.credential);
            await login(data.access_token)
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

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

                    <div className="login-google-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google login failed')}
                            useOneTap
                            text="signin_with"
                            shape="rectangular"
                            theme="outline"
                            size="large"
                            width="100%"
                        />
                    </div>

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