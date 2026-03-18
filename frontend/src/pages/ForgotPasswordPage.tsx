import { useState } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import "./login/Login.css"

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authAPI.forgotPassword(email);
            setMessage(response.message);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <span className="login-brand-name">Checkly</span>
                </div>

                <div className="login-card">
                    <h2>Forgot Password</h2>
                    <p className="login-card-subtitle">Enter your email to receive a reset link</p>

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

                    {message && (
                        <div className="login-success">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Sending...
                                </>
                            ) : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="login-signup">
                        Remember your password?{' '}
                        <a href="/login">Sign in</a>
                    </p>
                </div>
            </div>

            <div className="login-right">
                <div className="login-preview">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <p>App preview goes here</p>
                </div>
                <div className="login-right-text">
                    <h3>Reset your password</h3>
                    <p>We'll send you a link to reset your password safely.</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;