import { useState } from "react";
import { useDismissOnClick } from '@/hooks/useDismissOnClick';
import AuthHeader from '../../components/authHeader/AuthHeader';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { RegisterUser} from "@/types";
import { GoogleLogin } from "@react-oauth/google";
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
