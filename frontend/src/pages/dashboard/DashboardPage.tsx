import DashboardLayout from '../../components/DashBoardLayout';

const DashboardPage = () => {
    return (
        <DashboardLayout>
            <div>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    marginBottom: '24px'
                }}>
                    Today
                </h1>
                <div style={{
                    padding: '40px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-bg)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Tasks view coming soon...
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;