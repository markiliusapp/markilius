import { useState } from 'react';
import AuthHeader from '../components/authHeader/AuthHeader';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import "./login/Login.css"
import { useDismissOnClick } from '@/hooks/useDismissOnClick';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useDismissOnClick(() => { setError(''); setMessage('') }, !!(error || message))

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
                <AuthHeader />

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
                <div className="login-right-text">
                    <p className="login-right-quote">"Confine yourself to the present."</p>
                    <span className="login-right-cite">— Marcus Aurelius</span>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;