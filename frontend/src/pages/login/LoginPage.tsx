import { useState } from "react";
import { authAPI } from '../../services/auth'
import type { LoginRequest } from "@/types";
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';


import './Login.css'
import { useAuth } from "@/context/authContext";

const Login = () => {
    const { login } = useAuth()
    const [formData, setFormData] = useState<LoginRequest>({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
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
        try {
            const data = await authAPI.login(formData)
            await login(data.access_token)
            navigate("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
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

            {/* LEFT — Login form */}
            <div className="login-left">

                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="login-brand-name">Checkly</span>
                </div>

                {/* Card */}
                <div className="login-card">
                    <h2 className="login-card-title">Welcome back</h2>
                    <p className="login-card-subtitle">Sign in to your account to continue</p>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    <div style={{ marginTop: '16px' }}>
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

            {/* RIGHT — App preview */}
            <div className="login-right">
                <div className="login-preview">
                    <div className="login-preview-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <p>App preview goes here</p>
                </div>

                <div className="login-right-text">
                    <h3>Stay on top of your day</h3>
                    <p>Simple, focused task management. No clutter, no courses needed.</p>
                </div>
            </div>

        </div>
    )
}

export default Login