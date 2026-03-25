import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { authAPI, paymentAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashBoardLayout';
import './ProfilePage.css';
import { useDismissOnClick } from '@/hooks/useDismissOnClick';

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const ProfilePage = () => {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();

    const [infoForm, setInfoForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [infoLoading, setInfoLoading] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState('');
    const [infoError, setInfoError] = useState('');

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [billingLoading, setBillingLoading] = useState(false);
    const [billingError, setBillingError] = useState('');

    const [weeklyEmail, setWeeklyEmail] = useState(user?.weekly_email ?? true)
    const [monthlyEmail, setMonthlyEmail] = useState(user?.monthly_email ?? true);
    const [prefLoading, setPrefLoading] = useState(false);
    const [prefSuccess, setPrefSuccess] = useState('');
    const [prefError, setPrefError] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useDismissOnClick(() => {
        setInfoError(''); setInfoSuccess('');
        setPasswordError(''); setPasswordSuccess('');
        setBillingError('');
        setPrefError(''); setPrefSuccess('');
        setDeleteError('');
    }, !!(infoError || infoSuccess || passwordError || passwordSuccess || billingError || prefError || prefSuccess || deleteError))

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInfoLoading(true);
        setInfoSuccess('');
        setInfoError('');
        try {
            await authAPI.updateMe({
                first_name: infoForm.first_name,
                last_name: infoForm.last_name,
                email: infoForm.email,
            });
            await refreshUser();
            setInfoSuccess('Profile updated successfully.');
        } catch (err: unknown) {
            setInfoError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setInfoLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setBillingLoading(true);
        setBillingError('');
        try {
            const { url } = await paymentAPI.createPortalSession();
            window.location.href = url;
        } catch (err: unknown) {
            setBillingError(err instanceof Error ? err.message : 'Failed to open billing portal.');
            setBillingLoading(false);
        }
    };

    const handlePrefSubmit = async () => {
        setPrefLoading(true);
        setPrefSuccess('');
        setPrefError('');
        try {
            await authAPI.updateMe({ weekly_email: weeklyEmail, monthly_email: monthlyEmail, timezone: detectedTimezone });
            await refreshUser();
            setPrefSuccess('Preferences saved.');
        } catch (err: unknown) {
            setPrefError(err instanceof Error ? err.message : 'Failed to save preferences.');
        } finally {
            setPrefLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await authAPI.deleteMe();
            localStorage.removeItem('token');
            window.location.href = '/login?deleted=true';
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
            setDeleteLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordError('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (passwordForm.new_password.length < 10) {
            setPasswordError('New password must be at least 10 characters.');
            return;
        }

        setPasswordLoading(true);
        try {
            await authAPI.updateMe({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            setPasswordSuccess('Password changed successfully.');
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: unknown) {
            setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="profile-page">
                <div className="page-header">
                    <h1>Profile</h1>
                </div>

                <div className="profile-sections">
                    {/* Personal Info */}
                    <div className="profile-card">
                        <h2 className="profile-card-title">Personal Info</h2>
                        <p className="profile-card-subtitle">Update your name and email address.</p>

                        {infoSuccess && (
                            <div className="profile-success">{infoSuccess}</div>
                        )}
                        {infoError && (
                            <div className="profile-error">{infoError}</div>
                        )}

                        <form className="profile-form" onSubmit={handleInfoSubmit}>
                            <div className="profile-form-row">
                                <div className="form-field">
                                    <label htmlFor="first_name">First Name</label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        value={infoForm.first_name}
                                        onChange={e => setInfoForm(f => ({ ...f, first_name: e.target.value }))}
                                        placeholder="First name"
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        value={infoForm.last_name}
                                        onChange={e => setInfoForm(f => ({ ...f, last_name: e.target.value }))}
                                        placeholder="Last name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={infoForm.email}
                                    onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="Email address"
                                    required
                                />
                            </div>
                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="profile-btn profile-btn--primary"
                                    disabled={infoLoading}
                                >
                                    {infoLoading ? (
                                        <><span className="spinner" />Saving...</>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="profile-card">
                        <h2 className="profile-card-title">Change Password</h2>
                        <p className="profile-card-subtitle">Leave blank if you don't want to change your password.</p>

                        {passwordSuccess && (
                            <div className="profile-success">{passwordSuccess}</div>
                        )}
                        {passwordError && (
                            <div className="profile-error">{passwordError}</div>
                        )}

                        <form className="profile-form" onSubmit={handlePasswordSubmit}>
                            <div className="form-field">
                                <label htmlFor="current_password">Current Password</label>
                                <input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="new_password">New Password</label>
                                <input
                                    id="new_password"
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                                    placeholder="Enter new password"
                                    required
                                    minLength={10}
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="confirm_password">Confirm New Password</label>
                                <input
                                    id="confirm_password"
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="profile-btn profile-btn--primary"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? (
                                        <><span className="spinner" />Saving...</>
                                    ) : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* Email Preferences */}
                    <div className="profile-card">
                        <h2 className="profile-card-title">Email Preferences</h2>
                        <p className="profile-card-subtitle">
                            Receive a weekly summary every Sunday morning in your local time.
                        </p>

                        {prefSuccess && <div className="profile-success">{prefSuccess}</div>}
                        {prefError && <div className="profile-error">{prefError}</div>}

                        <div className="pref-row">
                            <div className="pref-info">
                                <span className="pref-label">Weekly Summary Email</span>
                                <span className="pref-desc">Sent Sunday at 8 AM · {user?.timezone || detectedTimezone}</span>
                            </div>
                            <button
                                className={`toggle-btn ${weeklyEmail ? 'toggle-btn--on' : ''}`}
                                onClick={() => setWeeklyEmail(v => !v)}
                                type="button"
                            >
                                <span className="toggle-thumb" />
                            </button>
                        </div>
                        <div className="pref-row">
                            <div className="pref-info">
                                <span className="pref-label">Monthly Summary Email</span>
                                <span className="pref-desc">Sent on the 1st of every month · {user?.timezone || detectedTimezone}</span>
                            </div>
                            <button
                                className={`toggle-btn ${monthlyEmail ? 'toggle-btn--on' : ''}`}
                                onClick={() => setMonthlyEmail(v => !v)}
                                type="button"
                            >
                                <span className="toggle-thumb" />
                            </button>
                        </div>

                        <div className="profile-form-actions" style={{ marginTop: '16px' }}>
                            <button
                                type="button"
                                className="profile-btn profile-btn--primary"
                                onClick={handlePrefSubmit}
                                disabled={prefLoading}
                            >
                                {prefLoading ? <><span className="spinner" />Saving...</> : 'Save Preferences'}
                            </button>
                        </div>
                    </div>

                    {/* Billing */}
                    <div className="profile-card">
                        <h2 className="profile-card-title">Billing</h2>
                        <p className="profile-card-subtitle">Manage your subscription and billing details.</p>

                        {billingError && <div className="profile-error">{billingError}</div>}

                        <div className="billing-row">
                            <div className="billing-plan-info">
                                <span className="billing-plan-label">
                                    {user?.subscription_tier === 'monthly' && 'Monthly Plan'}
                                    {user?.subscription_tier === 'yearly' && 'Yearly Plan'}
                                    {user?.subscription_tier === 'lifetime' && 'Lifetime Plan'}
                                </span>
                                <span className={`billing-status-badge billing-status-badge--${user?.subscription_status}`}>
                                    {user?.subscription_status === 'lifetime' ? 'Lifetime'
                                        : user?.subscription_status === 'past_due' ? 'Past Due'
                                        : user?.subscription_status === 'read_only' ? 'Read Only'
                                        : 'Active'}
                                </span>
                            </div>

                            {user?.subscription_status !== 'lifetime' && (
                                <button
                                    type="button"
                                    className="profile-btn profile-btn--secondary"
                                    onClick={handleManageBilling}
                                    disabled={billingLoading}
                                >
                                    {billingLoading ? <><span className="spinner" />Loading...</> : 'Manage Billing'}
                                </button>
                            )}
                        </div>

                        {user?.subscription_cancel_at && (
                            <p className="billing-cancel-notice">
                                Access ends on {new Date(user.subscription_cancel_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. To keep access, reactivate via the billing portal.
                            </p>
                        )}

                        {user?.subscription_status === 'lifetime' ? (
                            <p className="billing-hint">
                                For billing enquiries, contact <a href="mailto:support@markilius.com">support@markilius.com</a>
                            </p>
                        ) : (
                            <div className="billing-actions">
                                <button
                                    type="button"
                                    className="profile-btn profile-btn--primary"
                                    onClick={() => navigate('/pricing')}
                                >
                                    Upgrade Plan
                                </button>
                                <p className="billing-hint">
                                    Update your payment method, view invoices, or cancel your subscription via the billing portal.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Delete Account */}
                    <div className="profile-card profile-card--danger">
                        <h2 className="profile-card-title">Delete Account</h2>
                        <p className="profile-card-subtitle">
                            Permanently delete your account and all data. This cannot be undone.
                        </p>

                        {deleteError && <div className="profile-error">{deleteError}</div>}

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                className="profile-btn profile-btn--danger"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="delete-confirm">
                                <p className="delete-confirm-label">Type your email to confirm:</p>
                                <input
                                    type="email"
                                    className="delete-confirm-input"
                                    placeholder={user?.email}
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                />
                                <div className="delete-confirm-actions">
                                    <button
                                        type="button"
                                        className="profile-btn profile-btn--secondary"
                                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); setDeleteError(''); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-btn profile-btn--danger"
                                        disabled={deleteConfirm !== user?.email || deleteLoading}
                                        onClick={handleDeleteAccount}
                                    >
                                        {deleteLoading ? <><span className="spinner spinner--danger" />Deleting...</> : 'Confirm Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
