import { useState } from "react";
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { RegisterUser} from "@/types";
import { GoogleLogin } from "@react-oauth/google";
import '../login/Login.css'; // Reuse same CSS
import { useAuth } from "@/context/authContext";


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
    }

    if (registered) {
        return (
            <div className="login-page">
                <div className="login-left">
                    <div className="login-brand">
                        <div className="login-brand-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <span className="login-brand-name">Markilius</span>
                    </div>
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
                <div className="login-right">
                    <div className="login-right-text">
                        <h3>Start building better habits</h3>
                        <p>Track your progress, stay accountable, and achieve your goals.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">

            {/* LEFT — Register form */}
            <div className="login-left">

                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="login-brand-name">Markilius</span>
                </div>

                {/* Card */}
                <div className="login-card">
                    <h2 className="login-card-title">Create your account</h2>
                    <p className="login-card-subtitle">Get started with Markilius</p>

                    {/* Error */}
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
                            <label htmlFor="first_name">First Name</label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="John"
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
                                placeholder="Doe"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
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

            {/* RIGHT — App preview */}
            <div className="login-right">
                <div className="login-preview">
                    <div className="login-preview-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <p>App preview goes here</p>
                </div>

                <div className="login-right-text">
                    <h3>Start building better habits</h3>
                    <p>Track your progress, stay accountable, and achieve your goals.</p>
                </div>
            </div>

        </div>
    );
};

export default RegisterPage;