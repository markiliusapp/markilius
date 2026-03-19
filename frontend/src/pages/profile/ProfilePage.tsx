import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { authAPI } from '@/services/api';
import DashboardLayout from '@/components/DashBoardLayout';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();

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

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordError('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (passwordForm.new_password.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
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
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
