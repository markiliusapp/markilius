import { useState, useEffect } from 'react';
import AuthHeader from '../components/authHeader/AuthHeader';
import { authAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "./login/Login.css"

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
        }
    }, [token]);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!token) {
            setError('Invalid reset link');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.resetPassword(token, password);
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <AuthHeader />

                <div className="login-card">
                    <h2>Reset Password</h2>
                    <p className="login-card-subtitle">Enter your new password</p>

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

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-field">
                            <label htmlFor="password">New Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Resetting...
                                </>
                            ) : 'Reset Password'}
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

export default ResetPasswordPage;