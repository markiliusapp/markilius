import { useAuth } from '../../context/authContext';

const DashboardPage = () => {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: '40px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <h1>Dashboard</h1>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span>Welcome, {user?.first_name}!</span>
                    <button onClick={logout} className="login-button" style={{ width: 'auto', padding: '8px 16px' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={{
                padding: '40px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center'
            }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Dashboard content coming soon...
                </p>
            </div>
        </div>
    );
};

export default DashboardPage;